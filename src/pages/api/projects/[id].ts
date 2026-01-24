/**
 * Single Project API Endpoint
 * GET /api/projects/[id] - Fetch a single project by ID
 * PUT /api/projects/[id] - Update a project
 * DELETE /api/projects/[id] - Soft delete a project
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete (not hard delete)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute } from 'astro';
import { db, projects } from '../../../lib/db';
import { eq, and } from 'drizzle-orm';
import {
  apiHandler,
  validateBody,
  validateParams,
  NotFoundError,
  checkRateLimit,
  UnauthorizedError,
} from '../../../lib/api/error-handler';
import { checkRBAC } from '../../../lib/middleware/rbac';
import { filterFinancialData } from '../../../lib/middleware/data-filters';
import {
  updateProjectSchema,
  idParamSchema,
} from '../../../lib/validation/schemas';
import { excludeDeleted, softDelete } from '../../../lib/db/soft-delete';
import {
  logUpdate,
  logDelete,
  createAuditContext,
  sanitizeForAudit,
} from '../../../lib/api/audit-logger';

export const prerender = false;

// ========================================
// GET - Fetch single project
// ========================================

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate URL parameters
  const params = validateParams(context.params, idParamSchema);

  // RBAC Check - user must be a team member with canRead permission
  const rbacResult = await checkRBAC(context, params.id, 'canRead');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  const { permissions } = rbacResult;

  // Rate limiting
  checkRateLimit(`project-detail-${context.clientAddress}`, 200, 60000);

  console.log('GET /api/projects/' + params.id);

  // Fetch project (excluding soft-deleted)
  const [project] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.id, params.id),
      excludeDeleted()
    ))
    .limit(1);

  if (!project) {
    throw new NotFoundError('Project', params.id);
  }

  // Filter financial data based on permissions
  const filteredProject = filterFinancialData(project, permissions);

  return { project: filteredProject };
});

// ========================================
// PUT - Update project
// ========================================

export const PUT: APIRoute = apiHandler(async (context) => {
  // Validate URL parameters
  const params = validateParams(context.params, idParamSchema);

  // Validate request body
  const data = await validateBody(context, updateProjectSchema);

  // RBAC Check - user must have canWrite permission to update projects
  const rbacResult = await checkRBAC(context, params.id, 'canWrite');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  const { permissions } = rbacResult;

  // Rate limiting
  checkRateLimit(`project-update-${context.clientAddress}`, 20, 60000);

  console.log('PUT /api/projects/' + params.id, 'Data:', data);

  // Check if project exists and is not deleted
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.id, params.id),
      excludeDeleted()
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Project', params.id);
  }

  // Prepare update data - only include provided fields
  const updateData: any = {
    updatedAt: new Date(),
  };

  // Only update fields that were provided
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.projectNumber !== undefined) updateData.projectNumber = data.projectNumber;

  // Location
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;

  // Budget
  if (data.totalBudget !== undefined) {
    updateData.totalBudget = data.totalBudget;
    // Recalculate remaining budget
    updateData.remainingBudget = data.totalBudget - (existing.spentBudget || 0);
  }

  // Dates
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.estimatedCompletion !== undefined) updateData.estimatedCompletion = data.estimatedCompletion;

  // Team
  if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
  if (data.generalContractorId !== undefined) updateData.generalContractorId = data.generalContractorId;

  // Update project
  const [updated] = await db
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, params.id))
    .returning();

  console.log('Project updated successfully:', updated.id);

  // Log the update to audit log using authenticated user
  const user = context.locals.user!;
  const auditContext = createAuditContext(context, {
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Log audit (async, non-blocking)
  logUpdate(
    'projects',
    params.id,
    sanitizeForAudit(existing), // Old values
    sanitizeForAudit(updated),  // New values
    auditContext,
    'Project updated via API'
  ).catch(err => console.error('[AUDIT] Failed to log update:', err));

  // Filter financial data based on permissions
  const filteredProject = filterFinancialData(updated, permissions);

  return {
    message: 'Project updated successfully',
    project: filteredProject,
  };
});

// ========================================
// DELETE - Soft delete project
// ========================================

export const DELETE: APIRoute = apiHandler(async (context) => {
  // Validate URL parameters
  const params = validateParams(context.params, idParamSchema);

  // RBAC Check - user must have canDelete permission to delete projects
  const rbacResult = await checkRBAC(context, params.id, 'canDelete');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  // Rate limiting
  checkRateLimit(`project-delete-${context.clientAddress}`, 10, 60000);

  console.log('DELETE /api/projects/' + params.id);

  // Check if project exists and is not already deleted
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.id, params.id),
      excludeDeleted()
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Project', params.id);
  }

  // Soft delete the project using authenticated user
  const user = context.locals.user!;

  await db.execute(softDelete(projects, params.id, user.id));

  console.log('Project soft deleted:', params.id);

  // Log the delete to audit log
  const auditContext = createAuditContext(context, {
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Log audit (async, non-blocking)
  logDelete(
    'projects',
    params.id,
    sanitizeForAudit(existing), // Old values before deletion
    auditContext,
    'Project soft deleted via API'
  ).catch(err => console.error('[AUDIT] Failed to log delete:', err));

  return {
    message: 'Project deleted successfully',
    note: 'Project can be restored if needed',
  };
});
