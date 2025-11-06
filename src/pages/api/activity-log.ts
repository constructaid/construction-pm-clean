/**
 * Activity Log API Endpoint - PostgreSQL Version
 * GET /api/activity-log - Get activity log with filtering and pagination
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Rate limiting
 * - Pagination support
 * Note: This endpoint is READ-ONLY (no POST/PUT/DELETE needed as the audit logger writes to it)
 */
import type { APIRoute } from 'astro';
import { db, activityLog } from '../../lib/db';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateQuery,
  checkRateLimit,
} from '../../lib/api/error-handler';
import { paginationSchema } from '../../lib/validation/schemas';
import { z } from 'zod';

export const prerender = false;

// ========================================
// GET - Fetch activity log with filtering
// ========================================

// Query schema for GET
const activityLogQuerySchema = paginationSchema.extend({
  projectId: z.coerce.number().int().positive().optional(),
  entityType: z.string().optional(),
  entityId: z.coerce.number().int().positive().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'all']).default('all'),
  userId: z.coerce.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, activityLogQuerySchema);

  // Rate limiting (500 requests per minute for activity log reads)
  const rateLimitKey = `activity-log-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 500, 60000);

  console.log('GET /api/activity-log - Fetching activity log with filters:', query);

  // Build WHERE conditions
  const conditions = [];

  // Project filter
  if (query.projectId) {
    conditions.push(eq(activityLog.projectId, query.projectId));
  }

  // Entity type filter
  if (query.entityType) {
    conditions.push(eq(activityLog.entityType, query.entityType));
  }

  // Entity ID filter
  if (query.entityId) {
    conditions.push(eq(activityLog.entityId, query.entityId));
  }

  // Action filter
  if (query.action !== 'all') {
    conditions.push(eq(activityLog.action, query.action));
  }

  // User filter
  if (query.userId) {
    conditions.push(eq(activityLog.userId, query.userId));
  }

  // Date range filter
  if (query.startDate) {
    conditions.push(gte(activityLog.createdAt, query.startDate));
  }
  if (query.endDate) {
    conditions.push(lte(activityLog.createdAt, query.endDate));
  }

  // Fetch activity log with pagination
  const offset = (query.page - 1) * query.limit;

  // Get total count
  const countQuery = conditions.length > 0
    ? db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(activityLog)
        .where(and(...conditions))
    : db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(activityLog);

  const [{ count }] = await countQuery;

  // Get paginated results
  const resultQuery = conditions.length > 0
    ? db
        .select()
        .from(activityLog)
        .where(and(...conditions))
        .orderBy(
          query.sortOrder === 'desc' ? desc(activityLog.createdAt) : activityLog.createdAt
        )
        .limit(query.limit)
        .offset(offset)
    : db
        .select()
        .from(activityLog)
        .orderBy(
          query.sortOrder === 'desc' ? desc(activityLog.createdAt) : activityLog.createdAt
        )
        .limit(query.limit)
        .offset(offset);

  const result = await resultQuery;

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / query.limit);
  const hasNextPage = query.page < totalPages;
  const hasPrevPage = query.page > 1;

  console.log(`Found ${result.length} activity log entries (${count} total)`);

  return {
    activities: result,
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
