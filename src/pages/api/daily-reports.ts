/**
 * Daily Reports API Endpoint - PostgreSQL Version
 * Handles CRUD operations for Daily Reports
 * GET /api/daily-reports - Fetch daily reports with filtering and pagination
 * POST /api/daily-reports - Create new daily report
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete support (excludeDeleted)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute } from 'astro';
import { db, dailyReports } from '../../lib/db';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateBody,
  validateQuery,
  checkRateLimit,
} from '../../lib/api/error-handler';
import {
  createDailyReportSchema,
  paginationSchema,
} from '../../lib/validation/schemas';
import { excludeDeleted } from '../../lib/db/soft-delete';
import {
  logCreate,
  createAuditContext,
  sanitizeForAudit,
} from '../../lib/api/audit-logger';
import { z } from 'zod';

export const prerender = false;

// ========================================
// GET - Fetch daily reports with filtering
// ========================================

// Query schema for GET
const dailyReportsQuerySchema = paginationSchema.extend({
  projectId: z.coerce.number().int().positive().optional(),
  submittedBy: z.coerce.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minWorkers: z.coerce.number().int().nonnegative().optional(),
  maxWorkers: z.coerce.number().int().nonnegative().optional(),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, dailyReportsQuerySchema);

  // Rate limiting (200 requests per minute)
  const rateLimitKey = `daily-reports-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 200, 60000);

  console.log('GET /api/daily-reports - Fetching daily reports with filters:', query);

  // Build WHERE conditions
  const conditions = [excludeDeleted()];

  // Project filter
  if (query.projectId) {
    conditions.push(eq(dailyReports.projectId, query.projectId));
  }

  // Submitted by filter
  if (query.submittedBy) {
    conditions.push(eq(dailyReports.submittedBy, query.submittedBy));
  }

  // Date range filter
  if (query.startDate) {
    conditions.push(gte(dailyReports.reportDate, query.startDate));
  }
  if (query.endDate) {
    conditions.push(lte(dailyReports.reportDate, query.endDate));
  }

  // Worker count range filter
  if (query.minWorkers !== undefined) {
    conditions.push(sql`${dailyReports.totalWorkers} >= ${query.minWorkers}`);
  }
  if (query.maxWorkers !== undefined) {
    conditions.push(sql`${dailyReports.totalWorkers} <= ${query.maxWorkers}`);
  }

  // Fetch daily reports with pagination
  const offset = (query.page - 1) * query.limit;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(dailyReports)
    .where(and(...conditions));

  // Get paginated results
  const result = await db
    .select()
    .from(dailyReports)
    .where(and(...conditions))
    .orderBy(
      query.sortOrder === 'desc' ? desc(dailyReports.reportDate) : dailyReports.reportDate
    )
    .limit(query.limit)
    .offset(offset);

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / query.limit);
  const hasNextPage = query.page < totalPages;
  const hasPrevPage = query.page > 1;

  console.log(`Found ${result.length} daily reports (${count} total)`);

  return {
    dailyReports: result,
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
// POST - Create new daily report
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, createDailyReportSchema);

  // Rate limiting (50 creates per minute)
  const rateLimitKey = `daily-report-create-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 50, 60000);

  console.log('POST /api/daily-reports - Creating daily report for project:', data.projectId);

  // Create new daily report with validated data
  const newDailyReport = {
    projectId: data.projectId,
    reportDate: data.reportDate,
    weatherCondition: data.weatherCondition || null,
    temperature: data.temperature || null,
    totalWorkers: data.totalWorkers || 0,
    workPerformed: data.workPerformed,
    issues: data.issues || null,
    safetyNotes: data.safetyNotes || null,
    submittedBy: 1, // TODO: Replace with authenticated user ID
  };

  // Insert daily report
  const [result] = await db.insert(dailyReports).values(newDailyReport).returning();

  console.log('Daily report created successfully:', result.id);

  // Log the creation to audit log
  const auditContext = createAuditContext(context, {
    id: 1, // TODO: Replace with actual authenticated user ID
    email: 'system@example.com', // TODO: Replace with actual user email
    role: 'ADMIN', // TODO: Replace with actual user role
  });

  // Log audit (async, non-blocking)
  logCreate(
    'daily_reports',
    result.id,
    sanitizeForAudit(result),
    auditContext,
    'Daily report created via API'
  ).catch(err => console.error('[AUDIT] Failed to log create:', err));

  return {
    message: 'Daily report created successfully',
    dailyReportId: result.id,
    dailyReport: result,
  };
});
