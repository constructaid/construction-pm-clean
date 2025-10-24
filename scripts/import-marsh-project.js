/**
 * Import Script for Thomas C. Marsh Preparatory Academy Project
 * This script imports all project data from the file system into the database
 */

const PROJECT_ID = 3;
const PROJECT_PATH = 'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\forms and templates\\11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations';

// Payment Applications Data (extracted from G702/G703 forms)
const paymentApplications = [
  {
    number: 1,
    period: '05/31/2025',
    date: '2025-05-31',
    folder: '01 05.31.25',
    files: [
      'ORG 054 Thomas C. Marsh Elementry G702, G703 05.31.25.pdf',
      'ORG 054 Thomas C. Marsh Elementry G702, G703 05.31.25.xlsx'
    ]
  },
  {
    number: 2,
    period: '06/30/2025',
    date: '2025-06-30',
    folder: '02 06.30.25',
    files: [
      'ORG 054 Thomas C. Marsh Elementry G702 G703 06.30.25.pdf',
      'ORG 054 Thomas C. Marsh Elementry G702 G703.xlsx',
      'B2Gnow.pdf',
      'GC Application for Payment Review  Sign-Off.pdf'
    ]
  },
  {
    number: 3,
    period: '07/31/2025',
    date: '2025-07-31',
    folder: '03 07.31.25',
    files: [
      'ORG 054 Thomas C. Marsh Elementry G702 G703 07.31.25.pdf',
      'ORG 054 Thomas C. Marsh Elementry G702 G703.xlsx',
      'B2Gnow.pdf',
      'GC Application for Payment Review  Sign-Off.pdf',
      'ORG 054 THOMAS C MARSH MASTER SCHEDULE July 29.pdf',
      'ORG 054 THOMAS C MARSH MASTER SCHEDULE.pdf'
    ]
  },
  {
    number: 4,
    period: '08/31/2025',
    date: '2025-08-31',
    folder: '04 08.31.25',
    files: [
      'ORG 054 Thomas C. Marsh Elementry G702 G703 08.31.25.pdf',
      'ORG 054 Thomas C. Marsh Elementry G702 G703.xlsx',
      'JB&C__ThomasMarsh_INV02518.pdf'
    ]
  },
  {
    number: 5,
    period: '09/30/2025',
    date: '2025-09-30',
    folder: '05 09.30.25',
    files: [
      'ORG 054 Thomas C. Marsh Elementry G702 G703 09.30.25.pdf',
      'ORG 054 Thomas C. Marsh Elementry G702 G703.xlsx',
      'B2Gnow.pdf',
      '054.2025-09-22.CAEA 1 PCO 1 Fire Riser Valve Replacement - Signed.pdf'
    ]
  }
];

// RFIs discovered
const rfis = [
  { number: 1, title: 'ASBESTOS SCOPE CLARIFICATION', status: 'answered' },
  { number: 2, title: 'CADFILE REQUEST', status: 'answered' },
  { number: 3, title: 'EXISTING PHONE BOARD', status: 'answered' },
  { number: 4, title: 'RELOCATION OF PIPES IN DEMO WALL', status: 'answered' },
  { number: 5, title: 'PAINT ACCENT COLORS 3RD FLOOR', status: 'answered' },
  { number: 6, title: 'CANOPY DEMO DISCOVERY', status: 'answered' },
  { number: 7, title: 'SANITARY SEWER ALIGNMENT', status: 'answered' },
  { number: 8, title: 'WALL FINISHES & DOOR OPENING', status: 'answered' },
  { number: 9, title: 'PAINT AT STAIRWELLS', status: 'answered' },
  { number: 10, title: 'SIGNAGE', status: 'answered' },
  { number: 11, title: 'WATER METER VALVE AT STREET', status: 'answered' },
  { number: 12, title: 'Door Patch at Admin Area', status: 'answered' },
  { number: 13, title: 'ADMIN WALL THICKNESS & CEILING HEIGHTS', status: 'answered' },
  { number: 14, title: 'CLARIFICATION OF SIGNAGE SCOPE', status: 'answered' },
  { number: 15, title: 'AV COLOR SELECTION', status: 'answered' },
  { number: 16, title: 'LIGHTING - SELECTION REQUIRED', status: 'answered' },
  { number: 17, title: 'RE-ROUTING SANITARY CIVIL', status: 'answered' },
  { number: 18, title: 'RE-ROUTING 4 WATER CIVIL', status: 'answered' },
  { number: 19, title: 'RFI 19', status: 'answered' },
  { number: 20, title: 'Roofing questions', status: 'answered' }
];

// PCOs/Change Orders discovered
const changeOrders = [
  { number: 1, title: 'BUTTERFLY VALVE AND TAMPER SWITCH AT FIRE RISER', status: 'approved', type: 'CAEA' },
  { number: 2, title: 'SANITARY SEWER MODIFICATION AT CRAWLSPACE', status: 'proposed', type: 'PCO' },
  { number: 3, title: 'ADMIN AREA DOOR PATCH', status: 'proposed', type: 'PCO' },
  { number: 4, title: 'Sanitary at Crawlspace part 2', status: 'proposed', type: 'PCO' },
  { number: 5, title: 'ADMIN AREA CHANGES', status: 'proposed', type: 'PCO' },
  { number: 6, title: 'ASI 2 Storefront at Canopy Modifications', status: 'proposed', type: 'PCO' },
  { number: 7, title: 'Curtain Wall SF', status: 'proposed', type: 'PCO' },
  { number: 8, title: 'ASI # 1', status: 'proposed', type: 'PCO' },
  { number: 9, title: 'ASI # 2', status: 'proposed', type: 'PCO' }
];

console.log('Thomas C. Marsh Preparatory Academy - Data Import Summary');
console.log('==========================================================');
console.log(`Project ID: ${PROJECT_ID}`);
console.log(`Project Path: ${PROJECT_PATH}`);
console.log('');
console.log(`Payment Applications: ${paymentApplications.length}`);
console.log(`RFIs: ${rfis.length}`);
console.log(`Change Orders/PCOs: ${changeOrders.length}`);
console.log('');
console.log('Payment Applications:');
paymentApplications.forEach(app => {
  console.log(`  #${app.number} - ${app.period} (${app.files.length} files)`);
});
console.log('');
console.log('RFIs:');
rfis.forEach(rfi => {
  console.log(`  RFI-${String(rfi.number).padStart(3, '0')} - ${rfi.title}`);
});
console.log('');
console.log('Change Orders:');
changeOrders.forEach(co => {
  console.log(`  ${co.type}-${co.number} - ${co.title} [${co.status}]`);
});

module.exports = {
  PROJECT_ID,
  PROJECT_PATH,
  paymentApplications,
  rfis,
  changeOrders
};
