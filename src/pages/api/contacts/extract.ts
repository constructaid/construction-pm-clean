/**
 * Contact Extraction API
 * Scans project communications (emails, RFIs, submittals, etc.) to extract and update contact information
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, or } from 'drizzle-orm';
import { contacts, divisionContacts, contactCommunications } from '../../../lib/db/contacts-schema';
import { taskEmails } from '../../../lib/db/email-schema';
import {
  extractContactFromEmail,
  extractContactsFromDocument,
  mergeDuplicateContacts,
  type ExtractedContact
} from '../../../lib/services/contact-extraction';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

/**
 * POST - Extract contacts from project communications
 * Body: { projectId: number, sources: string[] }
 * sources can include: 'emails', 'rfis', 'submittals', 'change_orders', 'all'
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectId, sources = ['all'], autoUpdate = false } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const extractedContacts: ExtractedContact[] = [];
    const results = {
      projectId,
      sourcesScanned: [] as string[],
      contactsExtracted: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      errors: [] as string[],
    };

    // Extract from emails if requested
    if (sources.includes('all') || sources.includes('emails')) {
      try {
        const emails = await db
          .select()
          .from(taskEmails)
          .where(eq(taskEmails.projectId, projectId));

        results.sourcesScanned.push('emails');

        for (const email of emails) {
          try {
            const extracted = extractContactFromEmail({
              from: email.fromAddress || '',
              subject: email.subject || '',
              body: '', // Email body would need to be fetched from storage
              signature: '', // Would need email body parsing
            });

            if (extracted) {
              extractedContacts.push(extracted);
            }
          } catch (err) {
            results.errors.push(`Error extracting from email ${email.emailId}: ${err}`);
          }
        }
      } catch (err) {
        results.errors.push(`Error scanning emails: ${err}`);
      }
    }

    // TODO: Add extraction from RFIs, Submittals, Change Orders when needed
    // These would follow similar patterns

    // Merge duplicate contacts
    const uniqueContacts = mergeDuplicateContacts(extractedContacts);
    results.contactsExtracted = uniqueContacts.length;

    // If autoUpdate is true, create/update contacts in database
    if (autoUpdate) {
      for (const extracted of uniqueContacts) {
        try {
          // Check if contact already exists
          let existingContact = null;

          if (extracted.email) {
            const found = await db
              .select()
              .from(contacts)
              .where(
                and(
                  eq(contacts.projectId, projectId),
                  eq(contacts.email, extracted.email)
                )
              );
            if (found.length > 0) existingContact = found[0];
          }

          if (!existingContact && extracted.fullName && extracted.company) {
            const found = await db
              .select()
              .from(contacts)
              .where(
                and(
                  eq(contacts.projectId, projectId),
                  eq(contacts.fullName, extracted.fullName),
                  eq(contacts.company, extracted.company)
                )
              );
            if (found.length > 0) existingContact = found[0];
          }

          if (existingContact) {
            // Update existing contact with new information
            await db
              .update(contacts)
              .set({
                firstName: extracted.firstName || existingContact.firstName,
                lastName: extracted.lastName || existingContact.lastName,
                phoneMain: extracted.phoneMain || existingContact.phoneMain,
                phoneMobile: extracted.phoneMobile || existingContact.phoneMobile,
                address: extracted.address || existingContact.address,
                city: extracted.city || existingContact.city,
                state: extracted.state || existingContact.state,
                zipCode: extracted.zipCode || existingContact.zipCode,
                title: extracted.title || existingContact.title,
                trade: extracted.trade || existingContact.trade,
                lastContactDate: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(contacts.id, existingContact.id));

            results.contactsUpdated++;
          } else {
            // Create new contact
            const newContact = await db.insert(contacts).values({
              projectId: projectId,
              contactType: 'subcontractor', // Default, can be refined
              firstName: extracted.firstName,
              lastName: extracted.lastName,
              fullName: extracted.fullName || `${extracted.firstName || ''} ${extracted.lastName || ''}`.trim(),
              company: extracted.company || 'Unknown',
              email: extracted.email,
              phoneMain: extracted.phoneMain,
              phoneMobile: extracted.phoneMobile,
              address: extracted.address,
              city: extracted.city,
              state: extracted.state,
              zipCode: extracted.zipCode,
              title: extracted.title,
              trade: extracted.trade,
              primaryDivision: extracted.csiDivision,
              status: 'active',
              isVerified: false,
              sourceType: extracted.source,
              extractedBy: 'ai',
              lastContactDate: new Date(),
              csiDivisions: extracted.csiDivision ? [extracted.csiDivision] : [],
            }).returning();

            // Create division association if we identified a division
            if (extracted.csiDivision && newContact[0]) {
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

              const divisionName = divisionMappings[extracted.csiDivision] || extracted.csiDivision;

              await db.insert(divisionContacts).values({
                projectId: projectId,
                contactId: newContact[0].id,
                csiDivision: extracted.csiDivision,
                divisionName: divisionName,
                folderPath: `05 Subcontractor-Suppliers/DIV ${extracted.csiDivision} ${divisionName}`,
                role: 'primary',
                isActive: true,
              });
            }

            results.contactsCreated++;
          }
        } catch (err) {
          results.errors.push(`Error saving contact ${extracted.fullName || extracted.email}: ${err}`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results: results,
      extractedContacts: autoUpdate ? null : uniqueContacts, // Only return extracted data if not auto-updating
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting contacts:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to extract contacts',
      details: String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * GET - Get extraction preview without saving
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get sample of emails to show what would be extracted
    const emails = await db
      .select()
      .from(taskEmails)
      .where(eq(taskEmails.projectId, parseInt(projectId)))
      .limit(10);

    const preview: ExtractedContact[] = [];

    for (const email of emails) {
      const extracted = extractContactFromEmail({
        from: email.fromAddress || '',
        subject: email.subject || '',
        body: '',
        signature: '',
      });

      if (extracted) {
        preview.push(extracted);
      }
    }

    const unique = mergeDuplicateContacts(preview);

    return new Response(JSON.stringify({
      emailsScanned: emails.length,
      contactsFound: unique.length,
      preview: unique,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate preview' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
