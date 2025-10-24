/**
 * Migrate Contact Information from Subcontracts API
 * Extracts contact info from existing subcontract agreements and creates contact records
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { contacts, divisionContacts } from '../../../lib/db/contacts-schema';
import { subcontracts } from '../../../lib/db/contract-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

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
 * Parse CSI divisions from comma-separated string
 */
function parseCsiDivisions(divisionsStr?: string | null): string[] {
  if (!divisionsStr) return [];

  return divisionsStr
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length > 0);
}

/**
 * Determine trade from work description
 */
function determineTrade(workDescription: string, csiDivisions: string[]): string | null {
  const tradeMappings: Record<string, string> = {
    '02': 'Demolition',
    '03': 'Concrete',
    '04': 'Masonry',
    '05': 'Metals',
    '06': 'Carpentry',
    '07': 'Roofing & Waterproofing',
    '08': 'Doors & Windows',
    '09': 'Finishes',
    '10': 'Specialties',
    '12': 'Furnishings',
    '22': 'Plumbing',
    '23': 'HVAC',
    '26': 'Electrical',
    '28': 'Fire Alarm',
    '31': 'Earthwork',
    '32': 'Site Work',
  };

  // Use first CSI division if available
  if (csiDivisions.length > 0) {
    const division = csiDivisions[0];
    if (tradeMappings[division]) {
      return tradeMappings[division];
    }
  }

  // Try to detect from work description
  const lowerDesc = workDescription.toLowerCase();

  if (lowerDesc.includes('concrete')) return 'Concrete';
  if (lowerDesc.includes('masonry') || lowerDesc.includes('brick')) return 'Masonry';
  if (lowerDesc.includes('electrical')) return 'Electrical';
  if (lowerDesc.includes('plumbing')) return 'Plumbing';
  if (lowerDesc.includes('hvac') || lowerDesc.includes('mechanical')) return 'HVAC';
  if (lowerDesc.includes('roofing')) return 'Roofing & Waterproofing';
  if (lowerDesc.includes('framing') || lowerDesc.includes('carpentry')) return 'Carpentry';
  if (lowerDesc.includes('paint') || lowerDesc.includes('drywall')) return 'Finishes';
  if (lowerDesc.includes('excavat') || lowerDesc.includes('earthwork')) return 'Earthwork';
  if (lowerDesc.includes('paving') || lowerDesc.includes('site')) return 'Site Work';

  return null;
}

/**
 * POST - Migrate contacts from subcontract agreements
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectId, updateExisting = true } = body;

    const results = {
      subcontractsProcessed: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsSkipped: 0,
      divisionsLinked: 0,
      errors: [] as Array<{ subcontractId: number; error: string }>,
    };

    // Get all subcontracts for the project (or all if no projectId)
    let subcontractQuery;
    if (projectId) {
      subcontractQuery = await db
        .select()
        .from(subcontracts)
        .where(eq(subcontracts.projectId, projectId));
    } else {
      subcontractQuery = await db.select().from(subcontracts);
    }

    const subcontractRecords = subcontractQuery;

    for (const subcontract of subcontractRecords) {
      try {
        results.subcontractsProcessed++;

        // Skip if no company name
        if (!subcontract.subcontractorCompany) {
          results.contactsSkipped++;
          continue;
        }

        // Parse CSI divisions
        const csiDivisions = parseCsiDivisions(subcontract.csiDivisions);
        const primaryDivision = csiDivisions.length > 0 ? csiDivisions[0] : undefined;

        // Determine trade
        const trade = determineTrade(
          subcontract.workDescription || '',
          csiDivisions
        );

        // Check if contact already exists
        let existingContact = null;

        if (subcontract.subcontractorEmail) {
          const found = await db
            .select()
            .from(contacts)
            .where(and(
              eq(contacts.projectId, subcontract.projectId),
              eq(contacts.email, subcontract.subcontractorEmail)
            ))
            .limit(1);

          if (found.length > 0) existingContact = found[0];
        }

        if (!existingContact) {
          const found = await db
            .select()
            .from(contacts)
            .where(and(
              eq(contacts.projectId, subcontract.projectId),
              eq(contacts.company, subcontract.subcontractorCompany)
            ))
            .limit(1);

          if (found.length > 0) existingContact = found[0];
        }

        let contactId: number;

        if (existingContact) {
          if (updateExisting) {
            // Update existing contact
            await db
              .update(contacts)
              .set({
                fullName: subcontract.subcontractorName || existingContact.fullName,
                phoneMain: subcontract.subcontractorPhone || existingContact.phoneMain,
                email: subcontract.subcontractorEmail || existingContact.email,
                address: subcontract.subcontractorAddress || existingContact.address,
                trade: trade || existingContact.trade,
                csiDivisions: csiDivisions.length > 0 ? csiDivisions : existingContact.csiDivisions,
                primaryDivision: primaryDivision || existingContact.primaryDivision,
                subcontractId: subcontract.id,
                updatedAt: new Date(),
              })
              .where(eq(contacts.id, existingContact.id));

            contactId = existingContact.id;
            results.contactsUpdated++;
          } else {
            contactId = existingContact.id;
            results.contactsSkipped++;
          }
        } else {
          // Create new contact
          const nameParts = (subcontract.subcontractorName || '').split(' ');
          const firstName = nameParts[0] || undefined;
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined;

          const newContact = await db.insert(contacts).values({
            projectId: subcontract.projectId,
            contactType: 'subcontractor',
            fullName: subcontract.subcontractorName || subcontract.subcontractorCompany,
            firstName: firstName,
            lastName: lastName,
            company: subcontract.subcontractorCompany,
            email: subcontract.subcontractorEmail,
            phoneMain: subcontract.subcontractorPhone,
            address: subcontract.subcontractorAddress,
            trade: trade,
            specialty: subcontract.workDescription,
            csiDivisions: csiDivisions,
            primaryDivision: primaryDivision,
            status: 'active',
            isVerified: false,
            sourceType: 'import',
            extractedBy: 'migration',
            subcontractId: subcontract.id,
            notes: `Migrated from subcontract #${subcontract.contractNumber}`,
          }).returning();

          contactId = newContact[0].id;
          results.contactsCreated++;
        }

        // Create division associations
        if (csiDivisions.length > 0) {
          // Delete existing associations for this contact
          await db
            .delete(divisionContacts)
            .where(eq(divisionContacts.contactId, contactId));

          // Create new associations
          for (const division of csiDivisions) {
            const divisionName = divisionMappings[division] || division;

            await db.insert(divisionContacts).values({
              projectId: subcontract.projectId,
              contactId: contactId,
              csiDivision: division,
              divisionName: divisionName,
              folderPath: `05 Subcontractor-Suppliers/DIV ${division} ${divisionName}`,
              role: division === primaryDivision ? 'primary' : 'backup',
              scopeOfWork: subcontract.scopeOfWork,
              isActive: subcontract.status === 'active',
              startDate: subcontract.startDate,
              endDate: subcontract.completionDate,
            });

            results.divisionsLinked++;
          }
        }

      } catch (err: any) {
        results.errors.push({
          subcontractId: subcontract.id,
          error: err.message,
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
    console.error('Error migrating contacts:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to migrate contacts from subcontracts',
      details: String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * GET - Preview what would be migrated
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId');

    // Get all subcontracts
    let subcontractQuery;
    if (projectId) {
      subcontractQuery = await db
        .select()
        .from(subcontracts)
        .where(eq(subcontracts.projectId, parseInt(projectId)));
    } else {
      subcontractQuery = await db.select().from(subcontracts);
    }

    const subcontractRecords = subcontractQuery;

    const preview = subcontractRecords.map(sub => ({
      subcontractId: sub.id,
      contractNumber: sub.contractNumber,
      company: sub.subcontractorCompany,
      name: sub.subcontractorName,
      email: sub.subcontractorEmail,
      phone: sub.subcontractorPhone,
      address: sub.subcontractorAddress,
      workDescription: sub.workDescription,
      csiDivisions: parseCsiDivisions(sub.csiDivisions),
      status: sub.status,
    }));

    return new Response(JSON.stringify({
      total: preview.length,
      preview: preview,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate preview',
      details: String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
