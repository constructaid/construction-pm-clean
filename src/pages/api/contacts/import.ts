/**
 * Contact Import API
 * Bulk import contacts from CSV/Excel files
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { contacts, divisionContacts } from '../../../lib/db/contacts-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

interface ImportContact {
  fullName: string;
  firstName?: string;
  lastName?: string;
  company: string;
  email?: string;
  phoneMain?: string;
  phoneMobile?: string;
  phoneOffice?: string;
  title?: string;
  trade?: string;
  csiDivisions?: string[];
  primaryDivision?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactType?: string;
  businessLicense?: string;
  websiteUrl?: string;
  notes?: string;
}

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

/**
 * POST - Import contacts from CSV data
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectId, contacts: importContacts, updateExisting = false } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!importContacts || !Array.isArray(importContacts)) {
      return new Response(JSON.stringify({ error: 'contacts array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = {
      total: importContacts.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    };

    for (let i = 0; i < importContacts.length; i++) {
      const contact = importContacts[i] as ImportContact;

      try {
        // Validate required fields
        if (!contact.fullName || !contact.company) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields: fullName and company',
            data: contact,
          });
          continue;
        }

        // Check if contact exists (by email or name+company)
        let existingContact = null;

        if (contact.email) {
          const found = await db
            .select()
            .from(contacts)
            .where((c: any) => c.projectId === projectId && c.email === contact.email)
            .limit(1);

          if (found.length > 0) existingContact = found[0];
        }

        if (!existingContact) {
          const found = await db
            .select()
            .from(contacts)
            .where((c: any) =>
              c.projectId === projectId &&
              c.fullName === contact.fullName &&
              c.company === contact.company
            )
            .limit(1);

          if (found.length > 0) existingContact = found[0];
        }

        if (existingContact) {
          if (updateExisting) {
            // Update existing contact
            await db
              .update(contacts)
              .set({
                firstName: contact.firstName || existingContact.firstName,
                lastName: contact.lastName || existingContact.lastName,
                phoneMain: contact.phoneMain || existingContact.phoneMain,
                phoneMobile: contact.phoneMobile || existingContact.phoneMobile,
                phoneOffice: contact.phoneOffice || existingContact.phoneOffice,
                title: contact.title || existingContact.title,
                trade: contact.trade || existingContact.trade,
                address: contact.address || existingContact.address,
                city: contact.city || existingContact.city,
                state: contact.state || existingContact.state,
                zipCode: contact.zipCode || existingContact.zipCode,
                businessLicense: contact.businessLicense || existingContact.businessLicense,
                websiteUrl: contact.websiteUrl || existingContact.websiteUrl,
                notes: contact.notes || existingContact.notes,
                csiDivisions: contact.csiDivisions || existingContact.csiDivisions,
                primaryDivision: contact.primaryDivision || existingContact.primaryDivision,
                updatedAt: new Date(),
              })
              .where((c: any) => c.id === existingContact.id);

            results.updated++;

            // Update division associations if provided
            if (contact.csiDivisions && Array.isArray(contact.csiDivisions)) {
              await db.delete(divisionContacts).where((dc: any) => dc.contactId === existingContact.id);

              for (const division of contact.csiDivisions) {
                const divisionName = divisionMappings[division] || division;
                await db.insert(divisionContacts).values({
                  projectId: projectId,
                  contactId: existingContact.id,
                  csiDivision: division,
                  divisionName: divisionName,
                  folderPath: `05 Subcontractor-Suppliers/DIV ${division} ${divisionName}`,
                  role: division === contact.primaryDivision ? 'primary' : 'backup',
                  isActive: true,
                });
              }
            }
          } else {
            results.skipped++;
          }
        } else {
          // Create new contact
          const newContact = await db.insert(contacts).values({
            projectId: projectId,
            contactType: contact.contactType || 'subcontractor',
            firstName: contact.firstName,
            lastName: contact.lastName,
            fullName: contact.fullName,
            company: contact.company,
            email: contact.email,
            phoneMain: contact.phoneMain,
            phoneMobile: contact.phoneMobile,
            phoneOffice: contact.phoneOffice,
            title: contact.title,
            trade: contact.trade,
            address: contact.address,
            city: contact.city,
            state: contact.state,
            zipCode: contact.zipCode,
            businessLicense: contact.businessLicense,
            websiteUrl: contact.websiteUrl,
            notes: contact.notes,
            csiDivisions: contact.csiDivisions || [],
            primaryDivision: contact.primaryDivision,
            status: 'active',
            isVerified: false,
            sourceType: 'import',
            extractedBy: 'manual',
          }).returning();

          results.created++;

          // Create division associations
          if (contact.csiDivisions && Array.isArray(contact.csiDivisions)) {
            for (const division of contact.csiDivisions) {
              const divisionName = divisionMappings[division] || division;
              await db.insert(divisionContacts).values({
                projectId: projectId,
                contactId: newContact[0].id,
                csiDivision: division,
                divisionName: divisionName,
                folderPath: `05 Subcontractor-Suppliers/DIV ${division} ${divisionName}`,
                role: division === contact.primaryDivision ? 'primary' : 'backup',
                isActive: true,
              });
            }
          }
        }
      } catch (err: any) {
        results.errors.push({
          row: i + 1,
          error: err.message,
          data: contact,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to import contacts',
      details: String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
