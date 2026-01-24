/**
 * Submittals API Endpoint - PostgreSQL Version
 * Handles CRUD operations for Submittals
 * GET /api/submittals - Fetch submittals with filtering and pagination
 * POST /api/submittals - Create new submittal
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete support (excludeDeleted)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute } from 'astro';
import { db, submittals } from '../../lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateBody,
  validateQuery,
  checkRateLimit,
  UnauthorizedError,
} from '../../lib/api/error-handler';
import {
  createSubmittalSchema,
  paginationSchema,
} from '../../lib/validation/schemas';
import { excludeDeleted } from '../../lib/db/soft-delete';
import {
  logCreate,
  createAuditContext,
  sanitizeForAudit,
} from '../../lib/api/audit-logger';
import { checkRBAC } from '../../lib/middleware/rbac';
import { filterByScope } from '../../lib/middleware/data-filters';
import { z } from 'zod';

export const prerender = false;

// ========================================
// GET - Fetch submittals with filtering
// ========================================

// Query schema for GET
const submittalsQuerySchema = paginationSchema.extend({
  projectId: z.coerce.number().int().positive().optional(),
  status: z.enum(['pending', 'under_review', 'approved', 'approved_as_noted', 'rejected', 'resubmit', 'all']).default('all'),
  csiDivision: z.string().optional(),
  submittedBy: z.coerce.number().int().positive().optional(),
  reviewedBy: z.coerce.number().int().positive().optional(),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, submittalsQuerySchema);

  // RBAC Check - projectId is required for submittals
  if (!query.projectId) {
    throw new UnauthorizedError('projectId is required to fetch submittals');
  }

  const rbacResult = await checkRBAC(context, query.projectId, 'canRead');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  const { teamMember } = rbacResult;

  // Rate limiting (200 requests per minute)
  const rateLimitKey = `submittals-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 200, 60000);

  console.log('GET /api/submittals - Fetching submittals with filters:', query);

  // Build WHERE conditions
  const conditions = [excludeDeleted()];

  // Project filter
  if (query.projectId) {
    conditions.push(eq(submittals.projectId, query.projectId));
  }

  // Status filter
  if (query.status !== 'all') {
    conditions.push(eq(submittals.status, query.status));
  }

  // CSI Division filter
  if (query.csiDivision) {
    conditions.push(eq(submittals.csiDivision, query.csiDivision));
  }

  // Submitted by filter
  if (query.submittedBy) {
    conditions.push(eq(submittals.submittedBy, query.submittedBy));
  }

  // Reviewed by filter
  if (query.reviewedBy) {
    conditions.push(eq(submittals.reviewedBy, query.reviewedBy));
  }

  // Fetch submittals with pagination
  const offset = (query.page - 1) * query.limit;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(submittals)
    .where(and(...conditions));

  // Get paginated results
  const result = await db
    .select()
    .from(submittals)
    .where(and(...conditions))
    .orderBy(
      query.sortOrder === 'desc' ? desc(submittals.createdAt) : submittals.createdAt
    )
    .limit(query.limit)
    .offset(offset);

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / query.limit);
  const hasNextPage = query.page < totalPages;
  const hasPrevPage = query.page > 1;

  console.log(`Found ${result.length} submittals (${count} total)`);

  // Filter submittals by scope for subcontractors
  const filteredSubmittals = filterByScope(result, teamMember);

  return {
    submittals: filteredSubmittals,
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems: count,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
});

// ========================================
// POST - Create new submittal
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, createSubmittalSchema);

  // RBAC Check - requires canWrite permission for submittals
  const rbacResult = await checkRBAC(context, data.projectId, 'canWrite');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  // Rate limiting (20 creates per minute)
  const rateLimitKey = `submittal-create-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 20, 60000);

  console.log('POST /api/submittals - Creating submittal:', data.title);

  // Generate Submittal number (format: SUB-001, SUB-002, etc.)
  const existingSubs = await db
    .select()
    .from(submittals)
    .where(and(
      eq(submittals.projectId, data.projectId),
      excludeDeleted()
    ))
    .orderBy(desc(submittals.id));

  const subCount = existingSubs.length + 1;
  const submittalNumber = `SUB-${String(subCount).padStart(3, '0')}`;

  // Create new submittal with validated data
  const newSubmittal = {
    projectId: data.projectId,
    submittalNumber,
    csiDivision: data.csiDivision,
    specSection: data.specSection || null,
    title: data.title,
    description: data.description || null,
    status: data.status || 'pending',
    submittedBy: data.submittedBy,
    submittedDate: data.submittedDate || new Date(),
    reviewedBy: null,
    reviewedDate: null,
    dueDate: data.dueDate || null,
    reviewComments: null,
    attachments: data.attachments || [],
    relatedRFIs: data.relatedRFIs || [],
    tags: data.tags || [],
  };

  // Insert submittal
  const [result] = await db.insert(submittals).values(newSubmittal).returning();

  console.log('Submittal created successfully:', result.id, result.submittalNumber);

  // Log the creation to audit log using authenticated user
  const user = context.locals.user!;
  const auditContext = createAuditContext(context, {
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Log audit (async, non-blocking)
  logCreate(
    'submittals',
    result.id,
    sanitizeForAudit(result),
    auditContext,
    'Submittal created via API'
  ).catch(err => console.error('[AUDIT] Failed to log create:', err));

  return {
    message: 'Submittal created successfully',
    submittalId: result.id,
    submittalNumber: result.submittalNumber,
    submittal: result,
  };
});
