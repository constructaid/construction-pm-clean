import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\forms and templates\\11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations\\04 Meeting Minutes\\OAC Meeting\\ORG 054 Thomas C Marsh OAC Packet.xlsx';

// Read the workbook
const workbook = XLSX.readFile(filePath);

// Process Submittal Log
const submittalSheet = workbook.Sheets['Submittal Log'];
const rawData = XLSX.utils.sheet_to_json(submittalSheet, { header: 1, defval: '' });

// Find header row (looking for row with "TRACKING #")
let headerRowIndex = -1;
for (let i = 0; i < rawData.length; i++) {
  if (rawData[i][0] === 'TRACKING #') {
    headerRowIndex = i;
    break;
  }
}

console.log('Header row found at index:', headerRowIndex);

if (headerRowIndex >= 0) {
  const headers = rawData[headerRowIndex];

  // Get data rows (skip header row and subheader row)
  const dataRows = rawData.slice(headerRowIndex + 2);

  // Convert to objects - filter rows that have a tracking number (starts with digits)
  const submittals = dataRows
    .filter(row => {
      const trackingNum = String(row[0] || '').trim();
      return trackingNum && /^\d+$/.test(trackingNum); // Only numeric tracking numbers
    })
    .map(row => ({
      trackingNumber: String(row[0] || '').trim(),
      spec: String(row[1] || '').trim(),
      description: String(row[2] || '').trim(),
      vendor: String(row[3] || '').trim(),
      type: String(row[4] || '').trim(),
      phase: String(row[5] || '').trim(),
      dueDate: row[6] || '',
      longLead: String(row[7] || '').trim(),
      status: String(row[8] || '').trim(),
      reqdFromSubOn: row[9] || '',
      recdFromSubOn: row[10] || '',
      submittedToAE: row[11] || '',
      reqdFromAE: row[12] || '',
      returnedFromAE: row[13] || '',
      returnedToVendor: row[14] || '',
      closed: row[15] || '',
      comments: String(row[16] || '').trim()
    }));

  console.log(`Extracted ${submittals.length} submittals`);
  console.log('\nFirst 3 submittals:');
  submittals.slice(0, 3).forEach(s => {
    console.log(`${s.trackingNumber}: ${s.description} (${s.vendor}) - ${s.status}`);
  });

  // Save to file
  fs.writeFileSync(
    'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\scripts\\submittal-log-data.json',
    JSON.stringify(submittals, null, 2)
  );
  console.log('\nSubmittal log saved to submittal-log-data.json');
  console.log(`Total submittals saved: ${submittals.length}`);
}

// Also process Submittal Schedule
const scheduleSheet = workbook.Sheets['Submittal Schedule'];
const rawSchedule = XLSX.utils.sheet_to_json(scheduleSheet, { header: 1, defval: '' });

let scheduleHeaderIndex = -1;
for (let i = 0; i < rawSchedule.length; i++) {
  if (rawSchedule[i][0] === 'TRACKING #') {
    scheduleHeaderIndex = i;
    break;
  }
}

if (scheduleHeaderIndex >= 0) {
  const scheduleDataRows = rawSchedule.slice(scheduleHeaderIndex + 2);

  const scheduleItems = scheduleDataRows
    .filter(row => {
      const trackingNum = String(row[0] || '').trim();
      return trackingNum && /^\d+$/.test(trackingNum);
    })
    .map(row => ({
      trackingNumber: String(row[0] || '').trim(),
      spec: String(row[1] || '').trim(),
      description: String(row[2] || '').trim(),
      vendor: String(row[3] || '').trim(),
      type: String(row[4] || '').trim(),
      phase: String(row[5] || '').trim(),
      dueDate: row[6] || '',
      longLead: String(row[7] || '').trim(),
      status: String(row[8] || '').trim(),
      reqdFromSubOn: row[9] || '',
      recdFromSubOn: row[10] || '',
      submittedToAE: row[11] || '',
      reqdFromAE: row[12] || '',
      returnedFromAE: row[13] || '',
      returnedToVendor: row[14] || '',
      closed: row[15] || '',
      comments: String(row[16] || '').trim()
    }));

  console.log(`\nExtracted ${scheduleItems.length} schedule items`);

  fs.writeFileSync(
    'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\scripts\\submittal-schedule-data.json',
    JSON.stringify(scheduleItems, null, 2)
  );
  console.log('Submittal schedule saved to submittal-schedule-data.json');
}
