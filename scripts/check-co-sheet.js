import XLSX from 'xlsx';

const filePath = 'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\forms and templates\\11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations\\04 Meeting Minutes\\OAC Meeting\\ORG 054 Thomas C Marsh OAC Packet.xlsx';

const workbook = XLSX.readFile(filePath);
const coSheet = workbook.Sheets['Change order Log'];
const rawData = XLSX.utils.sheet_to_json(coSheet, { header: 1, defval: '' });

console.log('First 12 rows of Change Order Log sheet:\n');
rawData.slice(0, 12).forEach((row, idx) => {
  console.log(`Row ${idx}:`, row);
});
