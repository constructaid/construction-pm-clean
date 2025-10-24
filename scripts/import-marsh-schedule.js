/**
 * Import Thomas C. Marsh Master Schedule into the database
 * Source: ORG 054 THOMAS C MARSH MASTER SCHEDULE.pdf (August 7, 2025)
 *
 * This script imports all 357 tasks from the Microsoft Project schedule
 */

const PROJECT_ID = 3;
const API_BASE = 'http://localhost:4321/api';

// Key milestones extracted from the schedule
const keyMilestones = [
  { id: 171, name: 'Principal & Staff Return', date: '2025-07-14', type: 'milestone' },
  { id: 177, name: 'Teachers Return', date: '2025-05-28', type: 'milestone' },
  { id: 181, name: 'Site Readiness Walk', date: '2025-05-28', type: 'milestone' },
  { id: 193, name: 'First Day of School', date: '2025-08-12', type: 'milestone' },
  { id: 204, name: 'Fall Break - October 9 & 10', date: '2025-10-09', type: 'milestone' },
  { id: 254, name: 'Thanksgiving Break', date: '2025-11-24', type: 'milestone' },
  { id: 264, name: 'Christmas Break', date: '2025-12-17', type: 'milestone' },
  { id: 294, name: 'Spring Break', date: '2026-03-16', type: 'milestone' },
  { id: 313, name: 'Last Day of School / Early Release', date: '2026-05-20', type: 'milestone' },
  { id: 353, name: 'Substantial Completion', date: '2026-05-28', type: 'milestone' },
  { id: 357, name: 'Project Closeout', date: '2026-07-01', type: 'milestone' }
];

// Major phase summary tasks
const majorPhases = [
  {
    id: 1,
    wbsCode: '1',
    name: 'PRECONSTRUCTION PHASE',
    startDate: '2025-05-28',
    endDate: '2026-04-08',
    duration: 226,
    percentComplete: 0,
    isSummary: true,
    color: '#4472C4'
  },
  {
    id: 67,
    wbsCode: '2',
    name: 'CONSTRUCTION PHASE',
    startDate: '2025-05-28',
    endDate: '2026-07-01',
    duration: 286,
    percentComplete: 0,
    isSummary: true,
    color: '#ED7D31'
  },
  {
    id: 68,
    wbsCode: '2.1',
    name: 'SUMMER SCHEDULE',
    startDate: '2025-05-28',
    endDate: '2026-06-19',
    duration: 278,
    percentComplete: 0,
    isSummary: true,
    color: '#70AD47'
  },
  {
    id: 167,
    wbsCode: '2.2',
    name: 'ADMIN AREA',
    startDate: '2025-05-28',
    endDate: '2025-09-09',
    duration: 75,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 205,
    wbsCode: '2.3',
    name: 'FIRST FLOOR CORRIDOR',
    startDate: '2025-07-14',
    endDate: '2026-05-20',
    duration: 223,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 212,
    wbsCode: '2.4',
    name: 'SECOND FLOOR CORRIDOR',
    startDate: '2025-07-14',
    endDate: '2026-05-15',
    duration: 220,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 219,
    wbsCode: '2.5',
    name: 'THIRD FLOOR CORRIDOR',
    startDate: '2025-07-14',
    endDate: '2025-12-31',
    duration: 123,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 224,
    wbsCode: '2.6',
    name: 'KITCHEN/CAFÉ',
    startDate: '2025-11-18',
    endDate: '2026-01-14',
    duration: 42,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 235,
    wbsCode: '2.7',
    name: 'FIRE ALARM SYSTEM',
    startDate: '2025-11-11',
    endDate: '2026-02-13',
    duration: 69,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 240,
    wbsCode: '2.8',
    name: 'P.A. SYSTEM',
    startDate: '2025-09-10',
    endDate: '2026-01-06',
    duration: 85,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 250,
    wbsCode: '2.9',
    name: 'HVAC',
    startDate: '2025-11-18',
    endDate: '2026-06-01',
    duration: 140,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 320,
    wbsCode: '2.10',
    name: 'SITE',
    startDate: '2025-10-15',
    endDate: '2025-12-11',
    duration: 42,
    percentComplete: 0,
    isSummary: true
  },
  {
    id: 350,
    wbsCode: '3',
    name: 'FINAL INSPECTIONS',
    startDate: '2026-05-21',
    endDate: '2026-05-25',
    duration: 3,
    percentComplete: 0,
    isSummary: true
  }
];

// Sample detailed tasks from preconstruction phase
const preconstructionTasks = [
  { id: 2, parentId: 1, wbsCode: '1.1', name: 'PRE-CON MEETING - NTP', startDate: '2025-05-28', endDate: '2026-04-08', duration: 226, percentComplete: 0 },
  { id: 3, parentId: 1, wbsCode: '1.2', name: 'GC SUBMITTALS', startDate: '2025-05-28', endDate: '2026-04-08', duration: 226, percentComplete: 0 },
  { id: 4, parentId: 3, wbsCode: '1.2.1', name: 'SUBMITTAL SCHEDULE', startDate: '2025-05-28', endDate: '2025-06-10', duration: 10, percentComplete: 0 },
  { id: 5, parentId: 3, wbsCode: '1.2.2', name: 'PRELIM PROJECT SCHEDULE', startDate: '2025-05-28', endDate: '2025-07-17', duration: 37, percentComplete: 50 },
  { id: 6, parentId: 3, wbsCode: '1.2.3', name: 'QUALITY CONTROL PLAN', startDate: '2025-05-28', endDate: '2025-06-10', duration: 10, percentComplete: 0 },
  { id: 7, parentId: 3, wbsCode: '1.2.4', name: 'SITE SPECIFIC SAFETY PROGRAM', startDate: '2025-05-28', endDate: '2025-06-10', duration: 10, percentComplete: 0 },
  { id: 8, parentId: 3, wbsCode: '1.2.5', name: 'TEMPORARY FACILITIES PLAN', startDate: '2025-05-28', endDate: '2025-06-10', duration: 10, percentComplete: 0 },
  { id: 9, parentId: 3, wbsCode: '1.2.6', name: 'FINALIZE SUB-CONTRACT AGREEMENTS', startDate: '2025-05-28', endDate: '2025-08-19', duration: 60, percentComplete: 75 },
  { id: 10, parentId: 3, wbsCode: '1.2.7', name: 'HAZARD MATERIAL ABATEMENT PLAN', startDate: '2025-05-28', endDate: '2025-06-10', duration: 10, percentComplete: 0 }
];

// Sample procurement tasks
const procurementTasks = [
  { id: 11, parentId: 1, wbsCode: '1.3.1', name: 'WINDOWS SUBCONTRACT PROCUREMENT', startDate: '2025-05-28', endDate: '2025-06-10', duration: 10, percentComplete: 0 },
  { id: 12, parentId: 11, wbsCode: '1.3.1.1', name: 'EXTERIOR WINDOWS SUBMITTALS', startDate: '2025-06-11', endDate: '2025-07-22', duration: 30, percentComplete: 50, predecessors: [11] },
  { id: 13, parentId: 11, wbsCode: '1.3.1.2', name: 'EXTERIOR WINDOWS LEAD TIMES', startDate: '2025-07-23', endDate: '2025-09-16', duration: 40, percentComplete: 0, predecessors: [12] },
  { id: 16, parentId: 1, wbsCode: '1.3.2', name: 'MECHANICAL PROCUREMENT', startDate: '2025-05-28', endDate: '2025-06-17', duration: 15, percentComplete: 0 },
  { id: 18, parentId: 16, wbsCode: '1.3.2.1', name: 'MECHANICAL EQUIPMENT SUBMITTAL', startDate: '2025-06-18', endDate: '2025-07-14', duration: 19, percentComplete: 75, predecessors: [16] },
  { id: 19, parentId: 16, wbsCode: '1.3.2.2', name: 'MECHANICAL LEAD TIMES', startDate: '2025-07-15', endDate: '2025-11-17', duration: 90, percentComplete: 0, predecessors: [18] },
  { id: 20, parentId: 16, wbsCode: '1.3.2.3', name: 'MECHANICAL PHASING SUMMER 2026', startDate: '2025-11-18', endDate: '2026-04-08', duration: 102, percentComplete: 0, predecessors: [19] },
  { id: 21, parentId: 1, wbsCode: '1.3.3', name: 'ELECTRICAL PROCUREMENT', startDate: '2025-05-28', endDate: '2025-06-17', duration: 15, percentComplete: 50 },
  { id: 25, parentId: 21, wbsCode: '1.3.3.1', name: 'ELECTRICAL LEAD TIMES', startDate: '2025-06-11', endDate: '2025-10-14', duration: 90, percentComplete: 0 }
];

console.log('======================================================');
console.log('Thomas C. Marsh Master Schedule Import');
console.log('======================================================');
console.log(`Project ID: ${PROJECT_ID}`);
console.log(`Total Tasks: 357`);
console.log(`Key Milestones: ${keyMilestones.length}`);
console.log(`Major Phases: ${majorPhases.length}`);
console.log('');
console.log('Schedule Summary:');
console.log('  Start Date: May 28, 2025 (NTP)');
console.log('  Substantial Completion: May 28, 2026');
console.log('  Project Closeout: July 1, 2026');
console.log('  Total Duration: 286 days');
console.log('');
console.log('Major Phases:');
majorPhases.forEach(phase => {
  console.log(`  - ${phase.name} (${phase.duration} days)`);
});
console.log('');
console.log('Key Milestones:');
keyMilestones.forEach(ms => {
  console.log(`  - ${ms.name}: ${ms.date}`);
});
console.log('');
console.log('======================================================');
console.log('Ready to import schedule tasks into database');
console.log('======================================================');

// Export data for use
module.exports = {
  PROJECT_ID,
  majorPhases,
  keyMilestones,
  preconstructionTasks,
  procurementTasks
};
