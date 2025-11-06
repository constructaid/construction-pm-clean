/**
 * Individual Contact API Endpoint - PostgreSQL Version
 * GET, PUT, DELETE operations for a single contact
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Soft delete support (excludeDeleted)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { eq, and } from 'drizzle-orm';
import { contacts, divisionContacts } from '../../../lib/db/contacts-schema';
import {
  apiHandler,
  validateBody,
  checkRateLimit,
  NotFoundError,
} from '../../../lib/api/error-handler';
import { updateContactSchema } from '../../../lib/validation/schemas';
import { excludeDeleted, softDelete } from '../../../lib/db/soft-delete';
import {
  logUpdate,
  logDelete,
  createAuditContext,
  sanitizeForAudit,
  calculateChanges,
} from '../../../lib/api/audit-logger';

export const prerender = false;

// ========================================
// GET - Get single contact
// ========================================

export const GET: APIRoute = apiHandler(async (context) => {
  const contactId = parseInt(context.params.id!);

  // Rate limiting (500 requests per minute for reads)
  const rateLimitKey = `contact-get-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 500, 60000);

  console.log('GET /api/contacts/[id] - Fetching contact:', contactId);

  // Get contact (exclude soft-deleted)
  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, contactId), excludeDeleted()));

  if (!contact) {
    throw new NotFoundError('Contact not found');
  }

  // Get division associations
  const divisions = await db
    .select()
    .from(divisionContacts)
    .where(eq(divisionContacts.contactId, contactId));

  return {
    ...contact,
    divisions,
  };
});

// ========================================
// PUT - Update contact
// ========================================

export const PUT: APIRoute = apiHandler(async (context) => {
  const contactId = parseInt(context.params.id!);

  // Validate request body
  const data = await validateBody(context, updateContactSchema);

  // Rate limiting (100 updates per minute)
  const rateLimitKey = `contact-update-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 100, 60000);

  console.log('PUT /api/contacts/[id] - Updating contact:', contactId);

  // Get existing contact
  const [existing] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, contactId), excludeDeleted()));

  if (!existing) {
    throw new NotFoundError('Contact not found');
  }

  // Build update object (only include provided fields)
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  // Update all provided fields
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.company !== undefined) updateData.company = data.company;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phoneMain !== undefined) updateData.phoneMain = data.phoneMain;
  if (data.phoneMobile !== undefined) updateData.phoneMobile = data.phoneMobile;
  if (data.phoneOffice !== undefined) updateData.phoneOffice = data.phoneOffice;
  if (data.fax !== undefined) updateData.fax = data.fax;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
  if (data.csiDivisions !== undefined) updateData.csiDivisions = data.csiDivisions;
  if (data.primaryDivision !== undefined) updateData.primaryDivision = data.primaryDivision;
  if (data.trade !== undefined) updateData.trade = data.trade;
  if (data.specialty !== undefined) updateData.specialty = data.specialty;
  if (data.businessLicense !== undefined) updateData.businessLicense = data.businessLicense;
  if (data.taxId !== undefined) updateData.taxId = data.taxId;
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
  if (data.preferredContact !== undefined) updateData.preferredContact = data.preferredContact;
  if (data.languages !== undefined) updateData.languages = data.languages;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
  if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.lastContactDate !== undefined) updateData.lastContactDate = data.lastContactDate;

  // Update contact
  const [updated] = await db
    .update(contacts)
    .set(updateData)
    .where(eq(contacts.id, contactId))
    .returning();

  console.log('Contact updated successfully:', contactId);

  // Update division associations if CSI divisions provided
  if (data.csiDivisions && Array.isArray(data.csiDivisions)) {
    // Delete existing associations
    await db.delete(divisionContacts).where(eq(divisionContacts.contactId, contactId));

    // Create new associations
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
      projectId: existing.projectId,
      contactId: contactId,
      csiDivision: division,
      divisionName: divisionMappings[division] || division,
      folderPath: `05 Subcontractor-Suppliers/DIV ${division} ${divisionMappings[division] || division}`,
      role: division === data.primaryDivision ? 'primary' : 'backup',
      scopeOfWork: data.scopeOfWork || null,
      isActive: true,
    }));

    await db.insert(divisionContacts).values(divisionInserts);
  }

  // Detect changes and log to audit
  const changes = detectChanges(existing, updated);
  if (Object.keys(changes).length > 0) {
    const auditContext = createAuditContext(context, {
      id: 1, // TODO: Replace with actual authenticated user ID
      email: 'system@example.com', // TODO: Replace with actual user email
      role: 'ADMIN', // TODO: Replace with actual user role
    });

    logUpdate(
      'contacts',
      contactId,
      changes,
      auditContext,
      'Contact updated via API'
    ).catch(err => console.error('[AUDIT] Failed to log update:', err));
  }

  return {
    message: 'Contact updated successfully',
    contactId: updated.id,
    contact: updated,
  };
});

// ========================================
// DELETE - Soft delete contact
// ========================================

export const DELETE: APIRoute = apiHandler(async (context) => {
  const contactId = parseInt(context.params.id!);
  const userId = 1; // TODO: Replace with authenticated user ID

  // Rate limiting (50 deletes per minute)
  const rateLimitKey = `contact-delete-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 50, 60000);

  console.log('DELETE /api/contacts/[id] - Soft deleting contact:', contactId);

  // Get existing contact
  const [existing] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, contactId), excludeDeleted()));

  if (!existing) {
    throw new NotFoundError('Contact not found');
  }

  // Soft delete contact
  await db.execute(softDelete(contacts, contactId, userId));

  console.log('Contact soft deleted successfully:', contactId);

  // Log the deletion to audit log
  const auditContext = createAuditContext(context, {
    id: 1, // TODO: Replace with actual authenticated user ID
    email: 'system@example.com', // TODO: Replace with actual user email
    role: 'ADMIN', // TODO: Replace with actual user role
  });

  logDelete(
    'contacts',
    contactId,
    sanitizeForAudit(existing),
    auditContext,
    'Contact soft deleted via API'
  ).catch(err => console.error('[AUDIT] Failed to log delete:', err));

  return {
    message: 'Contact deleted successfully',
    contactId,
  };
});
