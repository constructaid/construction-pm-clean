/**
 * RFI API Endpoint - PostgreSQL Version
 * Handles CRUD operations for RFIs (Requests for Information)
 * GET /api/rfis - Fetch RFIs with filtering and pagination
 * POST /api/rfis - Create new RFI
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete support (excludeDeleted)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute} from 'astro';
import { db, rfis } from '../../lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateBody,
  validateQuery,
  checkRateLimit,
} from '../../lib/api/error-handler';
import {
  createRFISchema,
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
// GET - Fetch RFIs with filtering
// ========================================

// Query schema for GET
const rfisQuerySchema = paginationSchema.extend({
  projectId: z.coerce.number().int().positive().optional(),
  status: z.enum(['open', 'pending_response', 'answered', 'closed', 'all']).default('all'),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'all']).default('all'),
  submittedBy: z.coerce.number().int().positive().optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, rfisQuerySchema);

  // Rate limiting (200 requests per minute)
  const rateLimitKey = `rfis-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 200, 60000);

  console.log('GET /api/rfis - Fetching RFIs with filters:', query);

  // Build WHERE conditions
  const conditions = [excludeDeleted()];

  // Project filter
  if (query.projectId) {
    conditions.push(eq(rfis.projectId, query.projectId));
  }

  // Status filter
  if (query.status !== 'all') {
    conditions.push(eq(rfis.status, query.status));
  }

  // Priority filter
  if (query.priority !== 'all') {
    conditions.push(eq(rfis.priority, query.priority));
  }

  // Submitted by filter
  if (query.submittedBy) {
    conditions.push(eq(rfis.submittedBy, query.submittedBy));
  }

  // Assigned to filter
  if (query.assignedTo) {
    conditions.push(eq(rfis.assignedTo, query.assignedTo));
  }

  // Fetch RFIs with pagination
  const offset = (query.page - 1) * query.limit;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(rfis)
    .where(and(...conditions));

  // Get paginated results
  const result = await db
    .select()
    .from(rfis)
    .where(and(...conditions))
    .orderBy(
      query.sortOrder === 'desc' ? desc(rfis.createdAt) : rfis.createdAt
    )
    .limit(query.limit)
    .offset(offset);

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / query.limit);
  const hasNextPage = query.page < totalPages;
  const hasPrevPage = query.page > 1;

  console.log(`Found ${result.length} RFIs (${count} total)`);

  return {
    rfis: result,
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
// POST - Create new RFI
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, createRFISchema);

  // Rate limiting (20 creates per minute)
  const rateLimitKey = `rfi-create-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 20, 60000);

  console.log('POST /api/rfis - Creating RFI:', data.subject);

  // Generate RFI number (format: RFI-001, RFI-002, etc.)
  const existingRFIs = await db
    .select()
    .from(rfis)
    .where(and(
      eq(rfis.projectId, data.projectId),
      excludeDeleted()
    ))
    .orderBy(desc(rfis.id));

  const rfiCount = existingRFIs.length + 1;
  const rfiNumber = `RFI-${String(rfiCount).padStart(3, '0')}`;

  // Create new RFI with validated data
  const newRFI = {
    projectId: data.projectId,
    rfiNumber,
    subject: data.subject,
    description: data.description || null,
    question: data.question,
    response: null,
    status: data.status || 'open',
    priority: data.priority || 'medium',
    submittedBy: data.submittedBy,
    assignedTo: data.assignedTo || null,
    respondedBy: null,
    dueDate: data.dueDate || null,
    responseDate: null,
    cost: data.cost || 0,
    timeImpact: data.timeImpact || 0,
    attachments: data.attachments || [],
    tags: data.tags || [],
  };

  // Insert RFI
  const [result] = await db.insert(rfis).values(newRFI).returning();

  console.log('RFI created successfully:', result.id, result.rfiNumber);

  // Log the creation to audit log
  const auditContext = createAuditContext(context, {
    id: 1, // TODO: Replace with actual authenticated user ID
    email: 'system@example.com', // TODO: Replace with actual user email
    role: 'ADMIN', // TODO: Replace with actual user role
  });

  // Log audit (async, non-blocking)
  logCreate(
    'rfis',
    result.id,
    sanitizeForAudit(result),
    auditContext,
    'RFI created via API'
  ).catch(err => console.error('[AUDIT] Failed to log create:', err));

  return {
    message: 'RFI created successfully',
    rfiId: result.id,
    rfiNumber: result.rfiNumber,
    rfi: result,
  };
});
