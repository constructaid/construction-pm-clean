/**
 * Tasks API Endpoint - PostgreSQL Version
 * Handles CRUD operations for tasks
 * GET /api/tasks - Fetch tasks with filtering and pagination
 * POST /api/tasks - Create new task
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete support (excludeDeleted)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute } from 'astro';
import { db, tasks } from '../../lib/db';
import { eq, and, or, inArray, gte, lte, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateBody,
  validateQuery,
  checkRateLimit,
  UnauthorizedError,
} from '../../lib/api/error-handler';
import {
  createTaskSchema,
  paginationSchema,
} from '../../lib/validation/schemas';
import { excludeDeleted } from '../../lib/db/soft-delete';
import {
  logCreate,
  createAuditContext,
  sanitizeForAudit,
} from '../../lib/api/audit-logger';
import { checkRBAC } from '../../lib/middleware/rbac';
import { z } from 'zod';

export const prerender = false;

// ========================================
// GET - Fetch tasks with filtering
// ========================================

// Query schema for GET
const tasksQuerySchema = paginationSchema.extend({
  projectId: z.coerce.number().int().positive().optional(),
  assignedTo: z.string().optional(), // Can be comma-separated list of user IDs
  status: z.enum(['pending', 'in_progress', 'blocked', 'completed', 'cancelled', 'all']).default('all'),
  type: z.enum(['general', 'submittal', 'rfi', 'inspection', 'safety', 'milestone', 'all']).default('all'),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'all']).default('all'),
  filter: z.enum(['all', 'today', 'week', 'overdue']).default('all'),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, tasksQuerySchema);

  // RBAC Check - projectId is required for tasks
  if (!query.projectId) {
    throw new UnauthorizedError('projectId is required to fetch tasks');
  }

  const rbacResult = await checkRBAC(context, query.projectId, 'canRead');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  // Rate limiting (200 requests per minute)
  const rateLimitKey = `tasks-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 200, 60000);

  console.log('GET /api/tasks - Fetching tasks with filters:', query);

  // Build WHERE conditions
  const conditions = [excludeDeleted()];

  // Project filter
  if (query.projectId) {
    conditions.push(eq(tasks.projectId, query.projectId));
  }

  // Assigned to filter (supports comma-separated list)
  if (query.assignedTo) {
    const userIds = query.assignedTo.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (userIds.length > 0) {
      // assignedTo is a JSONB array, so we need to check if any of the user IDs are in it
      const assignedConditions = userIds.map(userId =>
        sql`${tasks.assignedTo}::jsonb @> ${JSON.stringify([userId])}::jsonb`
      );
      conditions.push(or(...assignedConditions));
    }
  }

  // Status filter
  if (query.status !== 'all') {
    conditions.push(eq(tasks.status, query.status));
  }

  // Type filter
  if (query.type !== 'all') {
    conditions.push(eq(tasks.type, query.type));
  }

  // Priority filter
  if (query.priority !== 'all') {
    conditions.push(eq(tasks.priority, query.priority));
  }

  // Date filters
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (query.filter === 'today') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    conditions.push(gte(tasks.dueDate, today));
    conditions.push(lte(tasks.dueDate, tomorrow));
  } else if (query.filter === 'week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    conditions.push(gte(tasks.dueDate, today));
    conditions.push(lte(tasks.dueDate, nextWeek));
  } else if (query.filter === 'overdue') {
    conditions.push(lte(tasks.dueDate, today));
    conditions.push(eq(tasks.status, 'pending')); // Only pending tasks can be overdue
  }

  // Fetch tasks with pagination
  const offset = (query.page - 1) * query.limit;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tasks)
    .where(and(...conditions));

  // Get paginated results
  const result = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(
      query.sortBy === 'priority' ? sql`
        CASE ${tasks.priority}
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
      ` : tasks.dueDate,
      tasks.createdAt
    )
    .limit(query.limit)
    .offset(offset);

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / query.limit);
  const hasNextPage = query.page < totalPages;
  const hasPrevPage = query.page > 1;

  console.log(`Found ${result.length} tasks (${count} total)`);

  return {
    tasks: result,
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
// POST - Create new task
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, createTaskSchema);

  // RBAC Check - requires canWrite permission for tasks
  const rbacResult = await checkRBAC(context, data.projectId, 'canWrite');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  // Rate limiting (20 creates per minute)
  const rateLimitKey = `task-create-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 20, 60000);

  console.log('POST /api/tasks - Creating task:', data.title);

  // Create new task with validated data
  const newTask = {
    projectId: data.projectId,
    title: data.title,
    description: data.description || null,
    type: data.type || 'general',
    status: data.status || 'pending',
    priority: data.priority || 'medium',
    assignedTo: data.assignedTo || [],
    assignedBy: data.assignedBy || null,
    dueDate: data.dueDate || null,
    completedAt: null,
    autoGenerated: data.autoGenerated || false,
    generatedFrom: data.generatedFrom || null,
    checklist: data.checklist || [],
    tags: data.tags || [],
    dependencies: data.dependencies || [],
    createdBy: data.createdBy || null,
  };

  // Insert task
  const [result] = await db.insert(tasks).values(newTask).returning();

  console.log('Task created successfully:', result.id);

  // Log the creation to audit log using authenticated user
  const user = context.locals.user!;
  const auditContext = createAuditContext(context, {
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Log audit (async, non-blocking)
  logCreate(
    'tasks',
    result.id,
    sanitizeForAudit(result),
    auditContext,
    'Task created via API'
  ).catch(err => console.error('[AUDIT] Failed to log create:', err));

  return {
    message: 'Task created successfully',
    taskId: result.id,
    task: result,
  };
});
