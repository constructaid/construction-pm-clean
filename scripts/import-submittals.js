import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { submittals } from '../src/lib/db/schema.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Convert Excel serial date to JavaScript Date
function excelSerialToDate(serial) {
  if (!serial || serial === '') return null;

  // Excel dates start from 1900-01-01 (serial 1)
  // But Excel incorrectly treats 1900 as a leap year
  const epoch = new Date(1899, 11, 30); // December 30, 1899
  const days = parseInt(serial);
  const date = new Date(epoch.getTime() + days * 24 * 60 * 60 * 1000);

  // Format as YYYY-MM-DD for PostgreSQL date type
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Read the submittal data
const submittalData = JSON.parse(
  fs.readFileSync('./scripts/submittal-log-data.json', 'utf-8')
);

console.log(`Loaded ${submittalData.length} submittals from file`);

// Connect to database
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

// Thomas Marsh project ID
const projectId = 1;

// Import submittals
async function importSubmittals() {
  console.log('\nImporting submittals...');

  let imported = 0;
  let errors = 0;

  for (const item of submittalData) {
    try {
      await db.insert(submittals).values({
        projectId: projectId,
        trackingNumber: item.trackingNumber,
        specSection: item.spec,
        description: item.description,
        vendor: item.vendor || null,
        type: item.type || null,
        phase: item.phase || null,
        longLead: item.longLead === 'YES',
        status: item.status || null,
        dueDate: excelSerialToDate(item.dueDate),
        reqdFromSubOn: excelSerialToDate(item.reqdFromSubOn),
        recdFromSubOn: excelSerialToDate(item.recdFromSubOn),
        submittedToAE: excelSerialToDate(item.submittedToAE),
        reqdFromAE: excelSerialToDate(item.reqdFromAE),
        returnedFromAE: excelSerialToDate(item.returnedFromAE),
        returnedToVendor: excelSerialToDate(item.returnedToVendor),
        closedDate: excelSerialToDate(item.closed),
        comments: item.comments || null,
      });

      imported++;
      console.log(`✓ Imported: ${item.trackingNumber} - ${item.description}`);
    } catch (error) {
      errors++;
      console.error(`✗ Error importing ${item.trackingNumber}:`, error.message);
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Total: ${submittalData.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Errors: ${errors}`);
}

// Run the import
importSubmittals()
  .then(() => {
    console.log('\nImport completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nImport failed:', error);
    process.exit(1);
  });
