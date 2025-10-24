/**
 * Contact Export API
 * Export contacts to CSV/Excel format
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql } from 'drizzle-orm';
import { contacts, divisionContacts } from '../../../lib/db/contacts-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.map(h => `"${h}"`).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '""';
      if (Array.isArray(value)) return `"${value.join(', ')}"`;
      if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * GET - Export contacts to CSV
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId');
    const division = url.searchParams.get('division');
    const contactType = url.searchParams.get('type');
    const format = url.searchParams.get('format') || 'csv';

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build query
    let query = db.select().from(contacts);
    const filters: any[] = [eq(contacts.projectId, parseInt(projectId))];

    if (contactType) {
      filters.push(eq(contacts.contactType, contactType));
    }

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

    let results = await query;

    // Filter by division if specified
    if (division) {
      const divisionContactIds = await db
        .select({ contactId: divisionContacts.contactId })
        .from(divisionContacts)
        .where(and(
          eq(divisionContacts.projectId, parseInt(projectId)),
          eq(divisionContacts.csiDivision, division)
        ));

      const ids = new Set(divisionContactIds.map(dc => dc.contactId));
      results = results.filter(c => ids.has(c.id));
    }

    // Format data for export
    const exportData = results.map(contact => ({
      'Full Name': contact.fullName,
      'First Name': contact.firstName || '',
      'Last Name': contact.lastName || '',
      'Company': contact.company,
      'Title': contact.title || '',
      'Email': contact.email || '',
      'Phone (Main)': contact.phoneMain || '',
      'Phone (Mobile)': contact.phoneMobile || '',
      'Phone (Office)': contact.phoneOffice || '',
      'Fax': contact.fax || '',
      'Address': contact.address || '',
      'City': contact.city || '',
      'State': contact.state || '',
      'ZIP Code': contact.zipCode || '',
      'Trade': contact.trade || '',
      'Specialty': contact.specialty || '',
      'CSI Divisions': Array.isArray(contact.csiDivisions) ? contact.csiDivisions.join(', ') : '',
      'Primary Division': contact.primaryDivision || '',
      'Contact Type': contact.contactType,
      'Business License': contact.businessLicense || '',
      'Website': contact.websiteUrl || '',
      'Preferred Contact': contact.preferredContact || '',
      'Status': contact.status,
      'Verified': contact.isVerified ? 'Yes' : 'No',
      'Source': contact.sourceType || '',
      'Notes': contact.notes || '',
      'Created Date': contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '',
      'Last Contact Date': contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : '',
    }));

    if (format === 'csv') {
      const csv = arrayToCSV(exportData);

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="contacts-project-${projectId}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      return new Response(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="contacts-project-${projectId}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid format. Use csv or json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error exporting contacts:', error);
    return new Response(JSON.stringify({
      error: 'Failed to export contacts',
      details: String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
