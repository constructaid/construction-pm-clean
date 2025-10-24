import XLSX from 'xlsx';

const filePath = 'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\forms and templates\\11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations\\04 Meeting Minutes\\OAC Meeting\\ORG 054 Thomas C Marsh OAC Packet.xlsx';

const workbook = XLSX.readFile(filePath);
const rfiSheet = workbook.Sheets['RFI Log'];
const rawData = XLSX.utils.sheet_to_json(rfiSheet, { header: 1, defval: '' });

console.log('First 15 rows of RFI Log sheet:\n');
rawData.slice(0, 15).forEach((row, idx) => {
  console.log(`Row ${idx}:`, row);
});
