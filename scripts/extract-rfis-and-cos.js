import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\forms and templates\\11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations\\04 Meeting Minutes\\OAC Meeting\\ORG 054 Thomas C Marsh OAC Packet.xlsx';

// Read the workbook
const workbook = XLSX.readFile(filePath);

// Process RFI Log
console.log('=== EXTRACTING RFI LOG ===\n');
const rfiSheet = workbook.Sheets['RFI Log'];
const rawRfiData = XLSX.utils.sheet_to_json(rfiSheet, { header: 1, defval: '' });

// Find header row (looking for "ID")
let rfiHeaderIndex = -1;
for (let i = 0; i < rawRfiData.length; i++) {
  if (rawRfiData[i][0] === 'ID') {
    rfiHeaderIndex = i;
    break;
  }
}

console.log('RFI header row found at index:', rfiHeaderIndex);

if (rfiHeaderIndex >= 0) {
  const headers = rawRfiData[rfiHeaderIndex];
  console.log('Headers:', headers);

  // Get data rows
  const rfiDataRows = rawRfiData.slice(rfiHeaderIndex + 1);

  // Convert to objects - filter rows that have an RFI ID (numeric)
  const rfis = rfiDataRows
    .filter(row => {
      const rfiId = String(row[0] || '').trim();
      return rfiId && /^\d+$/.test(rfiId);
    })
    .map(row => ({
      rfiNumber: String(row[0] || '').trim(),
      status: String(row[1] || '').trim(),
      priority: String(row[2] || '').trim(),
      specCode: String(row[3] || '').trim(),
      description: String(row[4] || '').trim(),
      requestedBy: String(row[5] || '').trim(),
      approvalAuthority: String(row[6] || '').trim(),
      dateRequested: row[7] || '',
      dateRequired: row[8] || '',
      dateReceived: row[9] || '',
      notes: String(row[10] || '').trim()
    }));

  console.log(`Extracted ${rfis.length} RFIs`);
  console.log('\nFirst 3 RFIs:');
  rfis.slice(0, 3).forEach(r => {
    console.log(`${r.rfiNumber}: ${r.description} - ${r.status}`);
  });

  // Save to file
  fs.writeFileSync(
    'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\scripts\\rfi-log-data.json',
    JSON.stringify(rfis, null, 2)
  );
  console.log(`\nRFI log saved to rfi-log-data.json (${rfis.length} RFIs)`);
}

// Process Change Order Log
console.log('\n\n=== EXTRACTING CHANGE ORDER LOG ===\n');
const coSheet = workbook.Sheets['Change order Log'];
const rawCoData = XLSX.utils.sheet_to_json(coSheet, { header: 1, defval: '' });

// Find header row (looking for "CO #" or similar)
let coHeaderIndex = -1;
for (let i = 0; i < rawCoData.length; i++) {
  const firstCell = String(rawCoData[i][0] || '').toUpperCase();
  if (firstCell.includes('CO') && (firstCell.includes('#') || firstCell.includes('NUM'))) {
    coHeaderIndex = i;
    break;
  }
}

console.log('CO header row found at index:', coHeaderIndex);

if (coHeaderIndex >= 0) {
  const headers = rawCoData[coHeaderIndex];
  console.log('Headers:', headers);

  // Get data rows
  const coDataRows = rawCoData.slice(coHeaderIndex + 1);

  // Convert to objects - filter rows that have a CO number
  const changeOrders = coDataRows
    .filter(row => {
      const coNum = String(row[0] || '').trim();
      return coNum && coNum.length > 0 && !isNaN(Number(coNum));
    })
    .map(row => ({
      coNumber: String(row[0] || '').trim(),
      description: String(row[1] || '').trim(),
      dateInitiated: row[6] || '', // Column 6: Date
      proposedAmount: row[7] || '', // Column 7: Proposed
      approvedAmount: row[8] || '', // Column 8: Approved
      comments: String(row[9] || '').trim() // Column 9: Comments
    }));

  console.log(`\nExtracted ${changeOrders.length} Change Orders`);
  console.log('\nFirst 3 Change Orders:');
  changeOrders.slice(0, 3).forEach(co => {
    console.log(`${co.coNumber}: ${co.description} - Proposed: ${co.proposedAmount}, Approved: ${co.approvedAmount}`);
  });

  // Save to file
  fs.writeFileSync(
    'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\scripts\\change-order-log-data.json',
    JSON.stringify(changeOrders, null, 2)
  );
  console.log(`\nChange Order log saved to change-order-log-data.json (${changeOrders.length} COs)`);
}
