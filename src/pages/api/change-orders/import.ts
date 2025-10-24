import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { changeOrders } from '../../../lib/db/schema';
import fs from 'fs';
import path from 'path';

// Convert Excel serial date to JavaScript Date
function excelSerialToDate(serial: any): Date | null {
  if (!serial || serial === '') return null;

  if (typeof serial === 'string') {
    return new Date(serial);
  }

  const epoch = new Date(1899, 11, 30);
  const days = parseInt(serial);
  if (isNaN(days)) return null;

  const date = new Date(epoch.getTime() + days * 24 * 60 * 60 * 1000);
  return date;
}

// Convert dollar amount to cents
function dollarsToCents(amount: any): number {
  if (!amount || amount === '') return 0;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 0;

  return Math.round(numAmount * 100);
}

// Map status from comments/data
function mapStatus(comments: string, proposedAmount: any, approvedAmount: any): 'proposed' | 'approved' | 'rejected' | 'executed' {
  const commentsLower = (comments || '').toLowerCase();

  if (approvedAmount && approvedAmount !== '') {
    return 'approved';
  } else if (proposedAmount && proposedAmount !== '') {
    return 'proposed';
  } else if (commentsLower.includes('reject')) {
    return 'rejected';
  } else if (commentsLower.includes('executed')) {
    return 'executed';
  }

  return 'proposed';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Read Change Order data from scripts folder
    const dataPath = path.join(process.cwd(), 'scripts', 'change-order-log-data.json');
    const coData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`Importing ${coData.length} Change Orders...`);

    let imported = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const item of coData) {
      try {
        const proposedCents = dollarsToCents(item.proposedAmount);
        const approvedCents = dollarsToCents(item.approvedAmount);

        const coRecord = {
          projectId: 1, // Thomas Marsh project
          changeOrderNumber: `CO-${String(item.coNumber).padStart(3, '0')}`,
          title: item.description || 'No title',
          description: item.description || 'No description',
          reason: item.comments || 'Imported from OAC packet',

          // Contract tracking - using defaults for now
          baseContractAmount: 0,
          clientContingency: 0,
          contingencyUsed: 0,
          contingencyRemaining: 0,

          // Proposed vs Approved amounts
          proposedAmount: proposedCents,
          approvedAmount: approvedCents,

          // Cost impact (use approved if available, otherwise proposed)
          costImpact: approvedCents > 0 ? approvedCents : proposedCents,
          originalCost: 0,
          revisedCost: approvedCents > 0 ? approvedCents : proposedCents,

          // Schedule impact - defaults
          scheduleImpactDays: 0,
          originalCompletion: null,
          revisedCompletion: null,

          // Status and approval
          status: mapStatus(item.comments, item.proposedAmount, item.approvedAmount),

          // Workflow
          initiatedBy: 1, // Default user
          approvedBy: approvedCents > 0 ? 2 : null,
          approvedAt: approvedCents > 0 ? excelSerialToDate(item.dateInitiated) : null,

          // Related items
          attachments: [],
          linkedRFIs: []
        };

        await db.insert(changeOrders).values(coRecord);
        imported++;
        console.log(`  ✓ Imported CO ${item.coNumber}: ${item.description} - $${item.proposedAmount || item.approvedAmount || '0'}`);
      } catch (error) {
        errors++;
        const errorMsg = `${item.coNumber}: ${error instanceof Error ? error.message : 'Failed query'}`;
        errorMessages.push(errorMsg);
        console.error(`  ✗ Error importing CO ${item.coNumber}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: coData.length,
        imported,
        errors,
        errorMessages: errorMessages.slice(0, 10)
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
