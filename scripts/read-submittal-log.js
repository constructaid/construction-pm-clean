import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\forms and templates\\11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations\\04 Meeting Minutes\\OAC Meeting\\ORG 054 Thomas C Marsh OAC Packet.xlsx';

// Read the workbook
const workbook = XLSX.readFile(filePath);

// Get sheet names
console.log('Available sheets:', workbook.SheetNames);
console.log('---\n');

// Read each sheet
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== SHEET: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  // Print first 5 rows to see structure
  console.log(`Rows: ${data.length}`);
  console.log('Sample data:');
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
  console.log('---\n');
});

// Save submittal log sheet to JSON file
if (workbook.SheetNames.includes('SUBMITTAL LOG')) {
  const submittalSheet = workbook.Sheets['SUBMITTAL LOG'];
  const submittalData = XLSX.utils.sheet_to_json(submittalSheet, { defval: '' });

  fs.writeFileSync(
    'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\scripts\\submittal-log-data.json',
    JSON.stringify(submittalData, null, 2)
  );
  console.log('\nSubmittal log saved to submittal-log-data.json');
}

// Also check for submittal schedule
if (workbook.SheetNames.includes('SUBMITTAL SCHEDULE')) {
  const scheduleSheet = workbook.Sheets['SUBMITTAL SCHEDULE'];
  const scheduleData = XLSX.utils.sheet_to_json(scheduleSheet, { defval: '' });

  fs.writeFileSync(
    'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\scripts\\submittal-schedule-data.json',
    JSON.stringify(scheduleData, null, 2)
  );
  console.log('Submittal schedule saved to submittal-schedule-data.json');
}
