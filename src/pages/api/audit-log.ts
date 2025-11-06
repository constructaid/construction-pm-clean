/**
 * Audit Log API Endpoint
 * GET /api/audit-log - Fetch audit log entries with filtering and pagination
 *
 * Features:
 * - Filter by table, record ID, action, user, date range
 * - Pagination support
 * - Rate limiting
 * - Admin-only access (requires authentication in production)
 */
import type { APIRoute } from 'astro';
import { db, auditLog } from '../../lib/db';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateQuery,
  checkRateLimit,
} from '../../lib/api/error-handler';
import { paginationSchema } from '../../lib/validation/schemas';
import { z } from 'zod';

export const prerender = false;

// ========================================
// GET - Fetch audit log entries
// ========================================

// Query schema for filtering audit logs
const auditLogQuerySchema = paginationSchema.extend({
  tableName: z.string().optional(),
  recordId: z.coerce.number().int().positive().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'RESTORE']).optional(),
  userId: z.coerce.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Optional: Require admin authentication in production
  // requireAuth(context);
  // requireRole(context, ['ADMIN']);

  // Validate query parameters
  const query = validateQuery(context, auditLogQuerySchema);

  // Rate limiting (100 requests per minute)
  const rateLimitKey = `audit-log-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 100, 60000);

  console.log('GET /api/audit-log - Fetching audit logs with filters:', query);

  // Build WHERE conditions
  const conditions = [];

  if (query.tableName) {
    conditions.push(eq(auditLog.tableName, query.tableName));
  }

  if (query.recordId) {
    conditions.push(eq(auditLog.recordId, query.recordId));
  }

  if (query.action) {
    conditions.push(eq(auditLog.action, query.action));
  }

  if (query.userId) {
    conditions.push(eq(auditLog.userId, query.userId));
  }

  if (query.startDate) {
    conditions.push(gte(auditLog.timestamp, query.startDate));
  }

  if (query.endDate) {
    conditions.push(lte(auditLog.timestamp, query.endDate));
  }

  // Fetch audit logs with pagination
  const offset = (query.page - 1) * query.limit;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(auditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Get paginated results
  const logs = await db
    .select()
    .from(auditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.timestamp))
    .limit(query.limit)
    .offset(offset);

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / query.limit);
  const hasNextPage = query.page < totalPages;
  const hasPrevPage = query.page > 1;

  console.log(`Found ${logs.length} audit log entries (${count} total)`);

  return {
    logs,
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
