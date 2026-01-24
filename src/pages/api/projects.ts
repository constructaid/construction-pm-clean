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
  search: z.string().optional(),
  minBudget: z.coerce.number().nonnegative().optional(),
  maxBudget: z.coerce.number().nonnegative().optional(),
  startDateFrom: z.string().optional(),
  startDateTo: z.string().optional(),
  archived: z.enum(['true', 'false', 'all']).default('false'),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Require authentication for project list
  requireAuth(context);

  // Validate query parameters
  const query = validateQuery(context, projectsQuerySchema);

  // Rate limiting (100 requests per minute per user)
  const rateLimitKey = query.userId
    ? `projects-list-${query.userId}`
    : `projects-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 100, 60000);

  const effectiveUserId = query.userId || context.locals.user?.id;
  console.log('GET /api/projects - userId:', effectiveUserId, '(from:', query.userId ? 'query' : 'session', ') status:', query.status, 'search:', query.search, 'archived:', query.archived);

  // Build WHERE conditions array
  const conditions: any[] = [excludeDeleted()];

  // Filter by archived status (default: exclude archived projects)
  if (query.archived === 'true') {
    conditions.push(eq(projects.isArchived, true));
  } else if (query.archived === 'false') {
    conditions.push(eq(projects.isArchived, false));
  }
  // If 'all', don't add any filter for isArchived

  // Filter by user (owner, GC, creator, or team member)
  // Use userId from query if provided, otherwise use authenticated user
  const userId = query.userId || context.locals.user?.id;
  if (userId) {
    conditions.push(
      or(
        eq(projects.ownerId, userId),
        eq(projects.generalContractorId, userId),
        eq(projects.createdBy, userId),
        sql`${projects.teamMembers}::jsonb @> ${JSON.stringify([userId])}`
      )
    );
  }

  // Add status filter if provided
  if (query.status && query.status !== 'all') {
    conditions.push(eq(projects.status, query.status as any));
  }

  // Add search filter (searches name, project number, description, address, city)
  if (query.search && query.search.trim() !== '') {
    const searchTerm = `%${query.search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${projects.name}) LIKE ${searchTerm}`,
        sql`LOWER(${projects.projectNumber}) LIKE ${searchTerm}`,
        sql`LOWER(${projects.description}) LIKE ${searchTerm}`,
        sql`LOWER(${projects.address}) LIKE ${searchTerm}`,
        sql`LOWER(${projects.city}) LIKE ${searchTerm}`
      )
    );
  }

  // Add budget range filters
  if (query.minBudget !== undefined) {
    conditions.push(sql`${projects.totalBudget} >= ${query.minBudget}`);
  }
  if (query.maxBudget !== undefined) {
    conditions.push(sql`${projects.totalBudget} <= ${query.maxBudget}`);
  }

  // Add date range filters
  if (query.startDateFrom) {
    conditions.push(sql`${projects.startDate} >= ${query.startDateFrom}`);
  }
  if (query.startDateTo) {
    conditions.push(sql`${projects.startDate} <= ${query.startDateTo}`);
  }

  // Build query with all conditions
  let dbQuery = db
    .select()
    .from(projects)
    .where(and(...conditions));

  // Apply pagination
  const result = await dbQuery
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  // Get total count for pagination with same filters
  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(projects)
    .where(and(...conditions));

  const count = countResult[0]?.count || 0;

  console.log(`[API /projects] Found ${result.length} projects for user ${userId}. Total: ${count}`);
  if (result.length > 0) {
    console.log(`[API /projects] First project: ${result[0].name} (ID: ${result[0].id})`);
  }

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
  // Require authentication and GC/ADMIN role to create projects
  requireAuth(context);

  // Only GC (General Contractors) and ADMIN can create projects
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can create projects');
  }

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

  // Log the creation to audit log using authenticated user
  const auditContext = createAuditContext(context, {
    id: user.id,
    email: user.email,
    role: user.role,
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
