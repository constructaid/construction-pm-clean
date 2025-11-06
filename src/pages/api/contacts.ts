/**
 * Contacts API Endpoint - PostgreSQL Version
 * Handles CRUD operations for Contacts (subcontractors, suppliers, vendors)
 * GET /api/contacts - Fetch contacts with filtering and pagination
 * POST /api/contacts - Create new contact
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete support (excludeDeleted)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { contacts, divisionContacts } from '../../lib/db/contacts-schema';
import {
  apiHandler,
  validateBody,
  validateQuery,
  checkRateLimit,
} from '../../lib/api/error-handler';
import {
  createContactSchema,
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
// GET - Fetch contacts with filtering
// ========================================

// Query schema for GET
const contactsQuerySchema = paginationSchema.extend({
  projectId: z.coerce.number().int().positive().optional(),
  contactType: z.enum(['subcontractor', 'supplier', 'vendor', 'consultant', 'inspector', 'owner_rep', 'architect', 'engineer', 'all']).default('all'),
  division: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blacklisted', 'prospect', 'all']).default('active'),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, contactsQuerySchema);

  // Rate limiting (200 requests per minute)
  const rateLimitKey = `contacts-list-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 200, 60000);

  console.log('GET /api/contacts - Fetching contacts with filters:', query);

  // Build WHERE conditions
  const conditions = [excludeDeleted()];

  // Project filter
  if (query.projectId) {
    conditions.push(eq(contacts.projectId, query.projectId));
  }

  // Contact type filter
  if (query.contactType !== 'all') {
    conditions.push(eq(contacts.contactType, query.contactType));
  }

  // Status filter
  if (query.status !== 'all') {
    conditions.push(eq(contacts.status, query.status));
  }

  // Division filter (requires subquery to divisionContacts table)
  if (query.division) {
    const divisionContactIds = await db
      .select({ contactId: divisionContacts.contactId })
      .from(divisionContacts)
      .where(eq(divisionContacts.csiDivision, query.division));

    const ids = divisionContactIds.map(dc => dc.contactId);
    if (ids.length > 0) {
      conditions.push(inArray(contacts.id, ids));
    } else {
      // No contacts in this division - return empty result
      return {
        contacts: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  }

  // Search filter (name, company, email, trade)
  if (query.search) {
    conditions.push(
      sql`(
        ${contacts.fullName} ILIKE ${`%${query.search}%`} OR
        ${contacts.company} ILIKE ${`%${query.search}%`} OR
        ${contacts.email} ILIKE ${`%${query.search}%`} OR
        ${contacts.trade} ILIKE ${`%${query.search}%`}
      )`
    );
  }

  // Fetch contacts with pagination
  const offset = (query.page - 1) * query.limit;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(contacts)
    .where(and(...conditions));

  // Get paginated results
  const result = await db
    .select()
    .from(contacts)
    .where(and(...conditions))
    .orderBy(
      query.sortOrder === 'desc' ? desc(contacts.fullName) : contacts.fullName
    )
    .limit(query.limit)
    .offset(offset);

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / query.limit);
  const hasNextPage = query.page < totalPages;
  const hasPrevPage = query.page > 1;

  console.log(`Found ${result.length} contacts (${count} total)`);

  return {
    contacts: result,
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
// POST - Create new contact
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, createContactSchema);

  // Rate limiting (50 creates per minute)
  const rateLimitKey = `contact-create-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 50, 60000);

  console.log('POST /api/contacts - Creating contact:', data.company);

  // Auto-generate fullName if not provided
  const fullName = data.fullName ||
    (data.firstName && data.lastName
      ? `${data.firstName} ${data.lastName}`.trim()
      : data.company);

  // Create new contact with validated data
  const newContact = {
    projectId: data.projectId,
    contactType: data.contactType,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    fullName,
    title: data.title || null,
    company: data.company,
    email: data.email || null,
    phoneMain: data.phoneMain || null,
    phoneMobile: data.phoneMobile || null,
    phoneOffice: data.phoneOffice || null,
    fax: data.fax || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zipCode: data.zipCode || null,
    csiDivisions: data.csiDivisions || null,
    primaryDivision: data.primaryDivision || null,
    trade: data.trade || null,
    specialty: data.specialty || null,
    businessLicense: data.businessLicense || null,
    taxId: data.taxId || null,
    websiteUrl: data.websiteUrl || null,
    preferredContact: data.preferredContact || 'email',
    languages: data.languages || null,
    status: data.status || 'active',
    isVerified: data.isVerified || false,
    isPrimary: data.isPrimary || false,
    sourceType: data.sourceType || 'manual',
    sourceDocumentId: data.sourceDocumentId || null,
    extractedBy: data.extractedBy || 'manual',
    userId: data.userId || null,
    subcontractId: data.subcontractId || null,
    notes: data.notes || null,
    tags: data.tags || null,
    lastContactDate: data.lastContactDate || null,
    createdBy: data.createdBy || 1, // TODO: Replace with authenticated user ID
  };

  // Insert contact
  const [result] = await db.insert(contacts).values(newContact).returning();

  console.log('Contact created successfully:', result.id, result.company);

  // If CSI divisions provided, create division contact associations
  if (data.csiDivisions && Array.isArray(data.csiDivisions)) {
    const divisionMappings: Record<string, string> = {
      '02': 'DEMO',
      '03': 'CONCRETE',
      '04': 'MASONRY',
      '05': 'METALS',
      '06': 'CARPENTRY',
      '07': 'THERMAL AND MOISTURE PROTECTION',
      '08': 'OPENINGS',
      '09': 'FINISHES',
      '10': 'SPECIALITIES',
      '12': 'FURNISHINGS',
      '22': 'PLUMBING',
      '23': 'HVAC',
      '26': 'ELECTRICAL VBC',
      '28': 'FIRE ALARM',
      '31': 'EARTHWORK',
      '32': 'EXTERIOR IMPROVEMENTS',
    };

    const divisionInserts = data.csiDivisions.map(division => ({
      projectId: data.projectId,
      contactId: result.id,
      csiDivision: division,
      divisionName: divisionMappings[division] || division,
      folderPath: `05 Subcontractor-Suppliers/DIV ${division} ${divisionMappings[division] || division}`,
      role: division === data.primaryDivision ? 'primary' : 'backup',
      scopeOfWork: data.scopeOfWork || null,
      isActive: true,
    }));

    await db.insert(divisionContacts).values(divisionInserts);
  }

  // Log the creation to audit log
  const auditContext = createAuditContext(context, {
    id: 1, // TODO: Replace with actual authenticated user ID
    email: 'system@example.com', // TODO: Replace with actual user email
    role: 'ADMIN', // TODO: Replace with actual user role
  });

  // Log audit (async, non-blocking)
  logCreate(
    'contacts',
    result.id,
    sanitizeForAudit(result),
    auditContext,
    'Contact created via API'
  ).catch(err => console.error('[AUDIT] Failed to log create:', err));

  return {
    message: 'Contact created successfully',
    contactId: result.id,
    contact: result,
  };
});
