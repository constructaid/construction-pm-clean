/**
 * Saved Filters API Endpoint - PostgreSQL Version
 * Manage saved search filters for users
 * GET /api/saved-filters - List saved filters
 * POST /api/saved-filters - Create new saved filter
 * PUT /api/saved-filters - Update saved filter
 * DELETE /api/saved-filters - Delete saved filter
 * PATCH /api/saved-filters - Track filter usage
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute} from 'astro';
import { db } from '../../lib/db';
import { eq, and, or, sql } from 'drizzle-orm';
import { savedFilters } from '../../lib/db/saved-filters-schema';
import {
  apiHandler,
  validateBody,
  validateQuery,
  checkRateLimit,
  NotFoundError,
} from '../../lib/api/error-handler';
import {
  logCreate,
  logUpdate,
  logDelete,
  createAuditContext,
  sanitizeForAudit,
  detectChanges,
} from '../../lib/api/audit-logger';
import { z } from 'zod';

export const prerender = false;

// ========================================
// VALIDATION SCHEMAS
// ========================================

const getSavedFiltersQuerySchema = z.object({
  userId: z.coerce.number().int().positive(),
  type: z.string().optional(),
  projectId: z.coerce.number().int().positive().optional(),
});

const createSavedFilterSchema = z.object({
  userId: z.number().int().positive(),
  projectId: z.number().int().positive().optional(),
  filterName: z.string().min(1, 'Filter name is required').max(200),
  filterType: z.string().min(1, 'Filter type is required').max(100),
  description: z.string().max(500).optional(),
  filterCriteria: z.record(z.any()),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  columns: z.array(z.string()).optional(),
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(false),
});

const updateSavedFilterSchema = z.object({
  filterId: z.number().int().positive(),
  userId: z.number().int().positive(),
  filterName: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  filterCriteria: z.record(z.any()).optional(),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  columns: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
});

const trackUsageSchema = z.object({
  filterId: z.number().int().positive(),
});

// ========================================
// GET - List saved filters
// ========================================

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, getSavedFiltersQuerySchema);

  // Rate limiting (200 requests per minute)
  const rateLimitKey = `saved-filters-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 200, 60000);

  console.log('GET /api/saved-filters - Fetching filters for user:', query.userId);

  // Build WHERE conditions
  const conditions = [
    or(
      eq(savedFilters.userId, query.userId),
      eq(savedFilters.isShared, true)
    )
  ];

  if (query.type) {
    conditions.push(eq(savedFilters.filterType, query.type));
  }

  if (query.projectId) {
    conditions.push(
      or(
        eq(savedFilters.projectId, query.projectId),
        eq(savedFilters.projectId, null as any)
      )
    );
  }

  // Fetch saved filters
  const result = await db
    .select()
    .from(savedFilters)
    .where(and(...conditions));

  console.log(`Found ${result.length} saved filters`);

  return { savedFilters: result };
});

// ========================================
// POST - Create new saved filter
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, createSavedFilterSchema);

  // Rate limiting (50 creates per minute)
  const rateLimitKey = `saved-filter-create-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 50, 60000);

  console.log('POST /api/saved-filters - Creating filter:', data.filterName);

  // If setting as default, unset any existing default for this user/type
  if (data.isDefault) {
    await db
      .update(savedFilters)
      .set({ isDefault: false })
      .where(and(
        eq(savedFilters.userId, data.userId),
        eq(savedFilters.filterType, data.filterType),
        eq(savedFilters.isDefault, true)
      ));
  }

  // Create new saved filter
  const [result] = await db.insert(savedFilters).values({
    userId: data.userId,
    projectId: data.projectId || null,
    filterName: data.filterName,
    filterType: data.filterType,
    description: data.description || null,
    filterCriteria: data.filterCriteria,
    sortBy: data.sortBy || null,
    sortOrder: data.sortOrder || null,
    columns: data.columns || null,
    isDefault: data.isDefault,
    isShared: data.isShared,
    useCount: 0,
  }).returning();

  console.log('Saved filter created successfully:', result.id);

  // Log the creation to audit log
  const auditContext = createAuditContext(context, {
    id: data.userId,
    email: 'user@example.com', // TODO: Get from authenticated user
    role: 'ADMIN', // TODO: Get from authenticated user
  });

  logCreate(
    'saved_filters',
    result.id,
    sanitizeForAudit(result),
    auditContext,
    'Saved filter created via API'
  ).catch(err => console.error('[AUDIT] Failed to log create:', err));

  return {
    message: 'Saved filter created successfully',
    filterId: result.id,
    savedFilter: result,
  };
});

// ========================================
// PUT - Update saved filter
// ========================================

export const PUT: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const { filterId, userId, ...updates } = await validateBody(context, updateSavedFilterSchema);

  // Rate limiting (100 updates per minute)
  const rateLimitKey = `saved-filter-update-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 100, 60000);

  console.log('PUT /api/saved-filters - Updating filter:', filterId);

  // Get existing filter
  const [existing] = await db
    .select()
    .from(savedFilters)
    .where(and(
      eq(savedFilters.id, filterId),
      eq(savedFilters.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Filter not found or unauthorized');
  }

  // If setting as default, unset other defaults
  if (updates.isDefault === true) {
    await db
      .update(savedFilters)
      .set({ isDefault: false })
      .where(and(
        eq(savedFilters.userId, userId),
        eq(savedFilters.filterType, existing.filterType),
        eq(savedFilters.isDefault, true)
      ));
  }

  // Update saved filter
  const [updated] = await db
    .update(savedFilters)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(savedFilters.id, filterId))
    .returning();

  console.log('Saved filter updated successfully:', filterId);

  // Detect changes and log to audit
  const changes = detectChanges(existing, updated);
  if (Object.keys(changes).length > 0) {
    const auditContext = createAuditContext(context, {
      id: userId,
      email: 'user@example.com', // TODO: Get from authenticated user
      role: 'ADMIN', // TODO: Get from authenticated user
    });

    logUpdate(
      'saved_filters',
      filterId,
      changes,
      auditContext,
      'Saved filter updated via API'
    ).catch(err => console.error('[AUDIT] Failed to log update:', err));
  }

  return {
    message: 'Saved filter updated successfully',
    filterId: updated.id,
    savedFilter: updated,
  };
});

// ========================================
// DELETE - Delete saved filter
// ========================================

export const DELETE: APIRoute = apiHandler(async (context) => {
  const filterId = context.url.searchParams.get('filterId');
  const userId = context.url.searchParams.get('userId');

  if (!filterId || !userId) {
    throw new Error('filterId and userId are required');
  }

  const filterIdNum = parseInt(filterId);
  const userIdNum = parseInt(userId);

  // Rate limiting (50 deletes per minute)
  const rateLimitKey = `saved-filter-delete-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 50, 60000);

  console.log('DELETE /api/saved-filters - Deleting filter:', filterIdNum);

  // Get existing filter for audit log
  const [existing] = await db
    .select()
    .from(savedFilters)
    .where(and(
      eq(savedFilters.id, filterIdNum),
      eq(savedFilters.userId, userIdNum)
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Filter not found or unauthorized');
  }

  // Hard delete (saved filters don't need soft delete)
  await db
    .delete(savedFilters)
    .where(and(
      eq(savedFilters.id, filterIdNum),
      eq(savedFilters.userId, userIdNum)
    ));

  console.log('Saved filter deleted successfully:', filterIdNum);

  // Log the deletion to audit log
  const auditContext = createAuditContext(context, {
    id: userIdNum,
    email: 'user@example.com', // TODO: Get from authenticated user
    role: 'ADMIN', // TODO: Get from authenticated user
  });

  logDelete(
    'saved_filters',
    filterIdNum,
    sanitizeForAudit(existing),
    auditContext,
    'Saved filter deleted via API'
  ).catch(err => console.error('[AUDIT] Failed to log delete:', err));

  return {
    message: 'Saved filter deleted successfully',
    filterId: filterIdNum,
  };
});

// ========================================
// PATCH - Track filter usage
// ========================================

export const PATCH: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, trackUsageSchema);

  // Rate limiting (500 updates per minute for usage tracking)
  const rateLimitKey = `saved-filter-track-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 500, 60000);

  console.log('PATCH /api/saved-filters - Tracking usage for filter:', data.filterId);

  // Increment use count and update last used timestamp
  await db
    .update(savedFilters)
    .set({
      useCount: sql`${savedFilters.useCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(eq(savedFilters.id, data.filterId));

  console.log('Filter usage tracked successfully');

  return {
    message: 'Filter usage tracked successfully',
    filterId: data.filterId,
  };
});
