/**
 * Change Orders API Endpoint - PostgreSQL Version
 * Handles CRUD operations for Change Orders
 * GET /api/change-orders - Fetch change orders with filtering and pagination
 * POST /api/change-orders - Create new change order
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete support (excludeDeleted)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute } from 'astro';
import { db, changeOrders } from '../../lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateBody,
  validateQuery,
  checkRateLimit,
} from '../../lib/api/error-handler';
import {
  createChangeOrderSchema,
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
// GET - Fetch change orders with filtering
// ========================================

// Query schema for GET
const changeOrdersQuerySchema = paginationSchema.extend({
  projectId: z.coerce.number().int().positive().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'implemented', 'all']).default('all'),
  initiatedBy: z.coerce.number().int().positive().optional(),
  minCostImpact: z.coerce.number().optional(),
  maxCostImpact: z.coerce.number().optional(),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, changeOrdersQuerySchema);

  // Rate limiting (200 requests per minute)
  const rateLimitKey = `change-orders-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 200, 60000);

  console.log('GET /api/change-orders - Fetching change orders with filters:', query);

  // Build WHERE conditions
  const conditions = [excludeDeleted()];

  // Project filter
  if (query.projectId) {
    conditions.push(eq(changeOrders.projectId, query.projectId));
  }

  // Status filter
  if (query.status !== 'all') {
    conditions.push(eq(changeOrders.status, query.status));
  }

  // Initiated by filter
  if (query.initiatedBy) {
    conditions.push(eq(changeOrders.initiatedBy, query.initiatedBy));
  }

  // Cost impact range filter
  if (query.minCostImpact !== undefined) {
    conditions.push(sql`${changeOrders.costImpact} >= ${query.minCostImpact}`);
  }
  if (query.maxCostImpact !== undefined) {
    conditions.push(sql`${changeOrders.costImpact} <= ${query.maxCostImpact}`);
  }

  // Fetch change orders with pagination
  const offset = (query.page - 1) * query.limit;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(changeOrders)
    .where(and(...conditions));

  // Get paginated results
  const result = await db
    .select()
    .from(changeOrders)
    .where(and(...conditions))
    .orderBy(
      query.sortOrder === 'desc' ? desc(changeOrders.createdAt) : changeOrders.createdAt
    )
    .limit(query.limit)
    .offset(offset);

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / query.limit);
  const hasNextPage = query.page < totalPages;
  const hasPrevPage = query.page > 1;

  console.log(`Found ${result.length} change orders (${count} total)`);

  return {
    changeOrders: result,
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
// POST - Create new change order
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, createChangeOrderSchema);

  // Rate limiting (20 creates per minute)
  const rateLimitKey = `change-order-create-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 20, 60000);

  console.log('POST /api/change-orders - Creating change order:', data.title);

  // Generate Change Order number (format: CO-001, CO-002, etc.)
  const existingCOs = await db
    .select()
    .from(changeOrders)
    .where(and(
      eq(changeOrders.projectId, data.projectId),
      excludeDeleted()
    ))
    .orderBy(desc(changeOrders.id));

  const coCount = existingCOs.length + 1;
  const changeOrderNumber = `CO-${String(coCount).padStart(3, '0')}`;

  // Create new change order with validated data
  const newChangeOrder = {
    projectId: data.projectId,
    changeOrderNumber,
    title: data.title,
    description: data.description,
    reason: data.reason,
    status: data.status || 'pending',
    costImpact: data.costImpact || 0,
    scheduleImpactDays: data.scheduleImpactDays || 0,
    initiatedBy: data.initiatedBy,
    approvedBy: null,
    approvedAt: null,
    implementedAt: null,
    attachments: data.attachments || [],
    tags: data.tags || [],
  };

  // Insert change order
  const [result] = await db.insert(changeOrders).values(newChangeOrder).returning();

  console.log('Change order created successfully:', result.id, result.changeOrderNumber);

  // Log the creation to audit log
  const auditContext = createAuditContext(context, {
    id: 1, // TODO: Replace with actual authenticated user ID
    email: 'system@example.com', // TODO: Replace with actual user email
    role: 'ADMIN', // TODO: Replace with actual user role
  });

  // Log audit (async, non-blocking)
  logCreate(
    'change_orders',
    result.id,
    sanitizeForAudit(result),
    auditContext,
    'Change order created via API'
  ).catch(err => console.error('[AUDIT] Failed to log create:', err));

  return {
    message: 'Change order created successfully',
    changeOrderId: result.id,
    changeOrderNumber: result.changeOrderNumber,
    changeOrder: result,
  };
});
