/**
 * Individual Contact API
 * GET, PUT, DELETE operations for a single contact
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { contacts, divisionContacts } from '../../../lib/db/contacts-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

// GET - Get single contact with division associations
export const GET: APIRoute = async ({ params }) => {
  try {
    const contactId = parseInt(params.id!);

    const contact = await db.select().from(contacts).where(eq(contacts.id, contactId));

    if (contact.length === 0) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get division associations
    const divisions = await db
      .select()
      .from(divisionContacts)
      .where(eq(divisionContacts.contactId, contactId));

    return new Response(JSON.stringify({
      ...contact[0],
      divisions: divisions,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch contact' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT - Update contact
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const contactId = parseInt(params.id!);
    const body = await request.json();

    const updated = await db
      .update(contacts)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
        fullName: body.fullName,
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
        preferredContact: body.preferredContact,
        languages: body.languages,
        status: body.status,
        isVerified: body.isVerified,
        isPrimary: body.isPrimary,
        notes: body.notes,
        tags: body.tags,
        lastContactDate: body.lastContactDate,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    if (updated.length === 0) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update division associations if provided
    if (body.csiDivisions && Array.isArray(body.csiDivisions)) {
      // Delete existing associations
      await db.delete(divisionContacts).where(eq(divisionContacts.contactId, contactId));

      // Create new associations
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
          contactId: contactId,
          csiDivision: division,
          divisionName: divisionName,
          folderPath: `05 Subcontractor-Suppliers/DIV ${division} ${divisionName}`,
          role: division === body.primaryDivision ? 'primary' : 'backup',
          scopeOfWork: body.scopeOfWork,
          isActive: true,
        });
      }
    }

    return new Response(JSON.stringify(updated[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return new Response(JSON.stringify({ error: 'Failed to update contact' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Delete contact
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const contactId = parseInt(params.id!);

    // Delete division associations first
    await db.delete(divisionContacts).where(eq(divisionContacts.contactId, contactId));

    // Delete contact
    const deleted = await db.delete(contacts).where(eq(contacts.id, contactId)).returning();

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Contact deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete contact' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
