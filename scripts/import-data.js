/**
 * Import all Thomas C. Marsh project data into the database
 */

const PROJECT_ID = 3;
const API_BASE = 'http://localhost:4321/api';

// RFI data to import
const rfis = [
  { number: '001', subject: 'ASBESTOS SCOPE CLARIFICATION', description: 'Clarification needed on asbestos abatement scope', question: 'What is the exact scope of asbestos abatement required?', status: 'answered', priority: 'high' },
  { number: '002', subject: 'CADFILE REQUEST', description: 'Request for CAD files', question: 'Can we get the CAD files for coordination?', status: 'answered', priority: 'medium' },
  { number: '003', subject: 'EXISTING PHONE BOARD', description: 'Questions about existing phone board', question: 'What should be done with the existing phone board?', status: 'answered', priority: 'low' },
  { number: '004', subject: 'RELOCATION OF PIPES IN DEMO WALL', description: 'Pipes discovered in demolition wall', question: 'How should we handle pipes found in demolition wall?', status: 'answered', priority: 'high' },
  { number: '005', subject: 'PAINT ACCENT COLORS 3RD FLOOR', description: 'Color selection needed for 3rd floor', question: 'What are the approved accent colors for 3rd floor painting?', status: 'answered', priority: 'medium' },
  { number: '006', subject: 'CANOPY DEMO DISCOVERY', description: 'Discovery during canopy demolition', question: 'How to proceed with canopy demo discovery?', status: 'answered', priority: 'high' },
  { number: '007', subject: 'SANITARY SEWER ALIGNMENT', description: 'Sanitary sewer alignment issues', question: 'Clarification needed on sanitary sewer alignment', status: 'answered', priority: 'high' },
  { number: '008', subject: 'WALL FINISHES & DOOR OPENING', description: 'Wall finishes and door opening details', question: 'What are the specifications for wall finishes and door opening?', status: 'answered', priority: 'medium' },
  { number: '009', subject: 'PAINT AT STAIRWELLS', description: 'Paint specifications for stairwells', question: 'What paint specifications apply to stairwells?', status: 'answered', priority: 'medium' },
  { number: '010', subject: 'SIGNAGE', description: 'Signage requirements', question: 'What are the signage requirements?', status: 'answered', priority: 'low' },
  { number: '011', subject: 'WATER METER VALVE AT STREET', description: 'Water meter valve location', question: 'Where should water meter valve be located at street?', status: 'answered', priority: 'high' },
  { number: '012', subject: 'Door Patch at Admin Area', description: 'Door patching in admin area', question: 'How should door patch be handled in admin area?', status: 'answered', priority: 'medium' },
  { number: '013', subject: 'ADMIN WALL THICKNESS & CEILING HEIGHTS', description: 'Admin area wall and ceiling dimensions', question: 'What are the wall thickness and ceiling heights for admin area?', status: 'answered', priority: 'medium' },
  { number: '014', subject: 'CLARIFICATION OF SIGNAGE SCOPE', description: 'Additional signage scope clarification', question: 'Need clarification on full signage scope', status: 'answered', priority: 'medium' },
  { number: '015', subject: 'AV COLOR SELECTION', description: 'AV equipment color selection', question: 'What colors are approved for AV equipment?', status: 'answered', priority: 'low' },
  { number: '016', subject: 'LIGHTING - SELECTION REQUIRED', description: 'Lighting fixture selection', question: 'Which lighting fixtures should be selected?', status: 'answered', priority: 'medium' },
  { number: '017', subject: 'RE-ROUTING SANITARY CIVIL', description: 'Sanitary system re-routing', question: 'How should sanitary civil be re-routed?', status: 'answered', priority: 'high' },
  { number: '018', subject: 'RE-ROUTING 4 WATER CIVIL', description: 'Water system re-routing', question: 'How should water civil system be re-routed?', status: 'answered', priority: 'high' },
  { number: '019', subject: 'RFI 19', description: 'General inquiry', question: 'General project inquiry', status: 'answered', priority: 'medium' },
  { number: '020', subject: 'Roofing Questions', description: 'Roofing system questions from Caillet', question: 'Clarification needed on roofing details', status: 'answered', priority: 'medium' }
];

// Change Order data to import
const changeOrders = [
  {
    number: 'CAEA-001',
    title: 'Fire Riser Valve Replacement - BUTTERFLY VALVE AND TAMPER SWITCH AT FIRE RISER',
    description: 'Replace butterfly valve and tamper switch at fire riser',
    reason: 'Required for fire safety compliance',
    status: 'approved',
    proposedAmount: 0,  // Amount to be determined from documents
    approvedAmount: 0
  },
  {
    number: 'PCO-002',
    title: 'SANITARY SEWER MODIFICATION AT CRAWLSPACE',
    description: 'Modification to sanitary sewer in crawlspace area',
    reason: 'Field condition requiring modification',
    status: 'proposed',
    proposedAmount: 0
  },
  {
    number: 'PCO-003',
    title: 'ADMIN AREA DOOR PATCH',
    description: 'Door patching work in administrative area',
    reason: 'Coordination with RFI-012',
    status: 'proposed',
    proposedAmount: 0
  },
  {
    number: 'PCO-004',
    title: 'Sanitary at Crawlspace part 2',
    description: 'Additional sanitary work at crawlspace',
    reason: 'Follow-up to PCO-002',
    status: 'proposed',
    proposedAmount: 0
  },
  {
    number: 'PCO-005',
    title: 'ADMIN AREA CHANGES',
    description: 'Various changes to administrative area',
    reason: 'Owner requested modifications',
    status: 'proposed',
    proposedAmount: 0
  },
  {
    number: 'PCO-006',
    title: 'ASI 2 Storefront at Canopy Modifications',
    description: 'Storefront modifications at canopy per ASI 2',
    reason: 'Architectural Supplemental Instruction #2',
    status: 'proposed',
    proposedAmount: 0
  },
  {
    number: 'PCO-007',
    title: 'Curtain Wall SF',
    description: 'Curtain wall modifications',
    reason: 'Design change for curtain wall system',
    status: 'proposed',
    proposedAmount: 0
  },
  {
    number: 'PCO-008',
    title: 'ASI # 1',
    description: 'Work per Architectural Supplemental Instruction #1',
    reason: 'Architectural Supplemental Instruction #1',
    status: 'proposed',
    proposedAmount: 0
  },
  {
    number: 'PCO-009',
    title: 'ASI # 2',
    description: 'Work per Architectural Supplemental Instruction #2',
    reason: 'Architectural Supplemental Instruction #2',
    status: 'proposed',
    proposedAmount: 0
  }
];

async function importRFIs() {
  console.log('\n=== Importing RFIs ===\n');

  for (const rfi of rfis) {
    try {
      const response = await fetch(`${API_BASE}/rfis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          rfiNumber: `RFI-${rfi.number}`,
          subject: rfi.subject,
          description: rfi.description,
          question: rfi.question,
          status: rfi.status,
          priority: rfi.priority,
          submittedBy: 1 // GC user ID
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✓ Created RFI-${rfi.number}: ${rfi.subject}`);
      } else {
        console.log(`✗ Failed RFI-${rfi.number}: ${result.message}`);
      }
    } catch (error) {
      console.log(`✗ Error RFI-${rfi.number}: ${error.message}`);
    }
  }
}

async function importChangeOrders() {
  console.log('\n=== Importing Change Orders ===\n');

  for (const co of changeOrders) {
    try {
      const response = await fetch(`${API_BASE}/change-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          title: co.title,
          description: co.description,
          reason: co.reason,
          costImpact: co.proposedAmount || 0,
          scheduleImpactDays: 0,
          initiatedBy: 1 // GC user ID
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✓ Created ${co.number}: ${co.title}`);
      } else {
        console.log(`✗ Failed ${co.number}: ${result.message}`);
      }
    } catch (error) {
      console.log(`✗ Error ${co.number}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('Thomas C. Marsh Project Data Import');
  console.log('========================================');
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`API Base: ${API_BASE}`);

  await importRFIs();
  await importChangeOrders();

  console.log('\n========================================');
  console.log('Import Complete!');
  console.log('========================================\n');
}

main().catch(console.error);
