/**
 * Contacts API
 * Manages project contacts (subcontractors, suppliers, vendors)
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { contacts, divisionContacts } from '../../lib/db/contacts-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

// GET - List all contacts or filter by project/division
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const projectId = url.searchParams.get('projectId');
    const division = url.searchParams.get('division');
    const contactType = url.searchParams.get('type');
    const search = url.searchParams.get('search');

    let query = db.select().from(contacts);

    // Build filters
    const filters: any[] = [];

    if (projectId) {
      filters.push(eq(contacts.projectId, parseInt(projectId)));
    }

    if (contactType) {
      filters.push(eq(contacts.contactType, contactType));
    }

    if (division) {
      // Need to join with divisionContacts to filter by division
      const divisionContactIds = await db
        .select({ contactId: divisionContacts.contactId })
        .from(divisionContacts)
        .where(eq(divisionContacts.csiDivision, division));

      const ids = divisionContactIds.map(dc => dc.contactId);
      if (ids.length > 0) {
        filters.push(inArray(contacts.id, ids));
      } else {
        // No contacts in this division
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (search) {
      filters.push(
        sql`(
          ${contacts.fullName} ILIKE ${`%${search}%`} OR
          ${contacts.company} ILIKE ${`%${search}%`} OR
          ${contacts.email} ILIKE ${`%${search}%`} OR
          ${contacts.trade} ILIKE ${`%${search}%`}
        )`
      );
    }

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

    const results = await query;

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch contacts' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST - Create new contact
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const newContact = await db.insert(contacts).values({
      projectId: body.projectId,
      contactType: body.contactType,
      firstName: body.firstName,
      lastName: body.lastName,
      fullName: body.fullName || `${body.firstName || ''} ${body.lastName || ''}`.trim(),
      title: body.title,
      company: body.company,
      email: body.email,
      phoneMain: body.phoneMain,
      phoneMobile: body.phoneMobile,
      phoneOffice: body.phoneOffice,
      fax: body.fax,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      csiDivisions: body.csiDivisions,
      primaryDivision: body.primaryDivision,
      trade: body.trade,
      specialty: body.specialty,
      businessLicense: body.businessLicense,
      taxId: body.taxId,
      websiteUrl: body.websiteUrl,
      preferredContact: body.preferredContact || 'email',
      languages: body.languages,
      status: body.status || 'active',
      isVerified: body.isVerified || false,
      isPrimary: body.isPrimary || false,
      sourceType: body.sourceType || 'manual',
      sourceDocumentId: body.sourceDocumentId,
      extractedBy: body.extractedBy || 'manual',
      userId: body.userId,
      subcontractId: body.subcontractId,
      notes: body.notes,
      tags: body.tags,
      lastContactDate: body.lastContactDate,
      createdBy: body.createdBy,
    }).returning();

    // If CSI divisions provided, create division contact associations
    if (body.csiDivisions && Array.isArray(body.csiDivisions)) {
      const divisionMappings = {
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

      for (const division of body.csiDivisions) {
        const divisionName = divisionMappings[division as keyof typeof divisionMappings] || division;
        await db.insert(divisionContacts).values({
          projectId: body.projectId,
          contactId: newContact[0].id,
          csiDivision: division,
          divisionName: divisionName,
          folderPath: `05 Subcontractor-Suppliers/DIV ${division} ${divisionName}`,
          role: division === body.primaryDivision ? 'primary' : 'backup',
          scopeOfWork: body.scopeOfWork,
          isActive: true,
        });
      }
    }

    return new Response(JSON.stringify(newContact[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    return new Response(JSON.stringify({ error: 'Failed to create contact' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
