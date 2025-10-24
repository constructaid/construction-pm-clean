import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { rfis } from '../../../lib/db/schema';
import fs from 'fs';
import path from 'path';

// Convert Excel serial date to JavaScript Date
function excelSerialToDate(serial: any): Date | null {
  if (!serial || serial === '') return null;

  if (typeof serial === 'string') {
    // Already a date string
    return new Date(serial);
  }

  // Excel serial date conversion
  const epoch = new Date(1899, 11, 30);
  const days = parseInt(serial);
  if (isNaN(days)) return null;

  const date = new Date(epoch.getTime() + days * 24 * 60 * 60 * 1000);
  return date;
}

// Map Excel status to database enum
function mapRfiStatus(excelStatus: string): 'open' | 'pending' | 'answered' | 'closed' {
  const normalized = (excelStatus || '').toUpperCase().trim();

  const statusMap: Record<string, 'open' | 'pending' | 'answered' | 'closed'> = {
    'OPEN': 'open',
    'PENDING': 'pending',
    'ANSWERED': 'answered',
    'CLOSED': 'closed',
    '': 'open'
  };

  return statusMap[normalized] || 'open';
}

// Map Excel priority to database enum
function mapPriority(excelPriority: string): 'low' | 'medium' | 'high' {
  const normalized = (excelPriority || '').toUpperCase().trim();

  const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
    'HIGH': 'high',
    'MEDIUM': 'medium',
    'LOW': 'low',
    '': 'medium'
  };

  return priorityMap[normalized] || 'medium';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Read RFI data from scripts folder
    const dataPath = path.join(process.cwd(), 'scripts', 'rfi-log-data.json');
    const rfiData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`Importing ${rfiData.length} RFIs...`);

    let imported = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const item of rfiData) {
      try {
        const rfiRecord = {
          projectId: 1, // Thomas Marsh project
          rfiNumber: item.rfiNumber,
          subject: item.description || 'No subject',
          description: item.notes || item.description || 'No description',
          question: item.description || 'No question',
          status: mapRfiStatus(item.status),
          priority: mapPriority(item.priority),
          submittedBy: 1, // Default user - can be updated later
          assignedTo: item.approvalAuthority ? 2 : null, // Architect or designer
          response: item.notes || null,
          respondedBy: item.dateReceived ? 2 : null,
          respondedAt: excelSerialToDate(item.dateReceived),
          dueDate: excelSerialToDate(item.dateRequired),
          closedAt: item.status.toUpperCase() === 'CLOSED' ? excelSerialToDate(item.dateReceived) : null,
          attachments: [],
          linkedDocuments: []
        };

        await db.insert(rfis).values(rfiRecord);
        imported++;
        console.log(`  ✓ Imported RFI ${item.rfiNumber}: ${item.description}`);
      } catch (error) {
        errors++;
        const errorMsg = `${item.rfiNumber}: ${error instanceof Error ? error.message : 'Failed query'}`;
        errorMessages.push(errorMsg);
        console.error(`  ✗ Error importing RFI ${item.rfiNumber}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: rfiData.length,
        imported,
        errors,
        errorMessages: errorMessages.slice(0, 10) // Limit to first 10 errors
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Import failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
