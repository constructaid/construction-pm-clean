/**
 * Projects API Endpoint - PostgreSQL Version
 * Handles CRUD operations for projects
 * GET /api/projects - Fetch projects for a user
 * POST /api/projects - Create new project
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete support (excludeDeleted)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute } from 'astro';
import { db, projects } from '../../lib/db';
import { eq, or, and, isNull, sql } from 'drizzle-orm';
import {
  apiHandler,
  requireAuth,
  validateBody,
  validateQuery,
  ConflictError,
  checkRateLimit,
} from '../../lib/api/error-handler';
import {
  createProjectSchema,
  paginationSchema,
} from '../../lib/validation/schemas';
import { excludeDeleted } from '../../lib/db/soft-delete';
import {
  logCreate,
  createAuditContext,
  sanitizeForAudit,
} from '../../lib/api/audit-logger';
import { z } from 'zod';

// ========================================
// GET - Fetch projects with pagination
// ========================================

// Query schema for GET
const projectsQuerySchema = paginationSchema.extend({
  userId: z.coerce.number().int().positive().optional(),
  status: z.enum(['planning', 'bidding', 'pre_construction', 'in_progress', 'closeout', 'completed', 'on_hold', 'all']).default('all'),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Optional: Require authentication if needed
  // requireAuth(context);

  // Validate query parameters
  const query = validateQuery(context, projectsQuerySchema);

  // Rate limiting (100 requests per minute per user)
  const rateLimitKey = query.userId
    ? `projects-list-${query.userId}`
    : `projects-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 100, 60000);

  console.log('GET /api/projects - userId:', query.userId, 'status:', query.status);

  // Build query - only non-deleted projects
  let dbQuery = db
    .select()
    .from(projects)
    .where(excludeDeleted());

  // Filter by user (owner or GC) if userId provided
  if (query.userId) {
    dbQuery = dbQuery.where(
      and(
        or(
          eq(projects.ownerId, query.userId),
          eq(projects.generalContractorId, query.userId)
        ),
        excludeDeleted()
      )
    ) as typeof dbQuery;
  }

  // Add status filter if provided
  if (query.status && query.status !== 'all') {
    dbQuery = dbQuery.where(
      and(
        eq(projects.status, query.status as any),
        excludeDeleted()
      )
    ) as typeof dbQuery;
  }

  // Apply pagination
  const result = await dbQuery
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  // Get total count for pagination
  const countQuery = db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(projects)
    .where(excludeDeleted());

  // Apply same filters to count
  let finalCountQuery = countQuery;
  if (query.userId) {
    finalCountQuery = finalCountQuery.where(
      and(
        or(
          eq(projects.ownerId, query.userId),
          eq(projects.generalContractorId, query.userId)
        ),
        excludeDeleted()
      )
    ) as typeof finalCountQuery;
  }
  if (query.status && query.status !== 'all') {
    finalCountQuery = finalCountQuery.where(
      and(
        eq(projects.status, query.status as any),
        excludeDeleted()
      )
    ) as typeof finalCountQuery;
  }

  const countResult = await finalCountQuery;
  const count = countResult[0]?.count || 0;

  return {
    projects: result,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / query.limit),
    },
  };
});

// ========================================
// POST - Create new project
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Optional: Require authentication and authorization
  // requireAuth(context);
  // requireRole(context, ['GC', 'ADMIN']);

  // Validate request body against schema
  const data = await validateBody(context, createProjectSchema);

  // Rate limiting (10 creates per minute)
  const rateLimitKey = data.generalContractorId
    ? `project-create-${data.generalContractorId}`
    : `project-create-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 10, 60000);

  console.log('POST /api/projects - Creating project:', data.name);

  // Check if project number already exists (excluding deleted projects)
  const existing = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.projectNumber, data.projectNumber),
        excludeDeleted()
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('Project number already exists');
  }

  // Create new project with validated data
  const newProject = {
    name: data.name,
    description: data.description || null,
    status: data.status || 'planning',
    projectNumber: data.projectNumber,

    // Location
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zipCode: data.zipCode || null,

    // Budget (already in cents from validation)
    totalBudget: data.totalBudget || 0,
    spentBudget: 0,
    allocatedBudget: 0,
    committedBudget: 0,
    remainingBudget: data.totalBudget || 0,

    // Dates (already parsed by Zod)
    startDate: data.startDate || null,
    estimatedCompletion: data.estimatedCompletion || null,
    actualCompletion: null,

    // Team
    ownerId: data.ownerId || null,
    generalContractorId: data.generalContractorId || null,
    teamMembers: [],

    // Progress
    progressPercentage: 0,
    completedMilestones: 0,
    totalMilestones: 0,

    // Metadata
    tags: [],
    settings: {},
    createdBy: data.generalContractorId || null,
  };

  // Insert project
  const [result] = await db.insert(projects).values(newProject).returning();

  console.log('Project created successfully:', result.id);

  // Log the creation to audit log
  // Note: In production, get user from context.locals.user (authentication)
  const auditContext = createAuditContext(context, {
    id: 1, // TODO: Replace with actual authenticated user ID
    email: 'system@example.com', // TODO: Replace with actual user email
    role: 'ADMIN', // TODO: Replace with actual user role
  });

  // Log audit (async, non-blocking)
  logCreate(
    'projects',
    result.id,
    sanitizeForAudit(result), // New values
    auditContext,
    'Project created via API'
  ).catch(err => console.error('[AUDIT] Failed to log create:', err));

  return {
    message: 'Project created successfully',
    projectId: result.id,
    project: result,
  };
});
