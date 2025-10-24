/**
 * Submittal Import API
 * Imports submittals from the OAC meeting packet data
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { submittals } from '../../../lib/db/schema';
import fs from 'fs';
import path from 'path';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

// Convert Excel serial date to JavaScript Date
function excelSerialToDate(serial: any): Date | null {
  if (!serial || serial === '') return null;

  const epoch = new Date(1899, 11, 30);
  const days = parseInt(serial);
  const date = new Date(epoch.getTime() + days * 24 * 60 * 60 * 1000);

  return date;
}

// Extract CSI division from spec section
function extractCsiDivision(spec: string): string {
  if (!spec) return '00';
  const match = spec.match(/^(\d{2})/);
  return match ? match[1] : '00';
}

// Map submittal status
function mapStatus(excelStatus: string): string {
  const statusMap: Record<string, string> = {
    'APPROVED': 'approved',
    'SUBMITTED': 'in_review',
    'REJECTED': 'rejected',
    'REVISE AND RESUBMIT': 'in_review',
    '': 'draft'
  };

  const normalized = (excelStatus || '').toUpperCase().trim();
  return statusMap[normalized] || 'draft';
}

/**
 * POST - Import submittals from JSON file
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const projectId = 1; // Thomas Marsh project

    // Read submittal data from scripts folder
    const dataPath = path.join(process.cwd(), 'scripts', 'submittal-log-data.json');
    const submittalData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`Loaded ${submittalData.length} submittals from file`);

    let imported = 0;
    let errors: string[] = [];

    for (const item of submittalData) {
      try {
        const submittalRecord = {
          projectId: projectId,
          submittalNumber: item.trackingNumber,
          csiDivision: extractCsiDivision(item.spec),
          specSection: item.spec || null,
          title: item.description,
          description: item.comments || null,
          status: mapStatus(item.status),
          submittedBy: 1, // Default system user
          finalStatus: item.status || null,
          dueDate: excelSerialToDate(item.dueDate),
          submittedDate: excelSerialToDate(item.submittedToAE),
          gcReviewDate: excelSerialToDate(item.recdFromSubOn),
          architectReviewDate: excelSerialToDate(item.returnedFromAE),
          gcComments: `Vendor: ${item.vendor || 'N/A'}, Type: ${item.type || 'N/A'}, Phase: ${item.phase || 'N/A'}, Long Lead: ${item.longLead || 'NO'}`,
          architectComments: item.comments || null,
          attachments: [],
          revisionHistory: []
        };

        await db.insert(submittals).values(submittalRecord);
        imported++;

        console.log(`✓ Imported: ${item.trackingNumber} - ${item.description}`);
      } catch (error: any) {
        errors.push(`${item.trackingNumber}: ${error.message}`);
        console.error(`✗ Error importing ${item.trackingNumber}:`, error.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: submittalData.length,
        imported,
        errors: errors.length,
        errorDetails: errors
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error importing submittals:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to import submittals', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
