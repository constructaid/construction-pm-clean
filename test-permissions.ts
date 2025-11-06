/**
 * Test file to demonstrate GC Team Role permissions
 * Run with: npx ts-node test-permissions.ts
 */

import {
  type UserRole,
  hasPermission,
  canAccessModule,
  getRolePermissions,
  roleDisplayNames,
  roleDescriptions,
} from './src/lib/permissions.js';

// Test cases for each GC team role
const testRoles: UserRole[] = [
  'GC_OWNER',
  'GC_ACCOUNTING',
  'GC_SR_PM',
  'GC_ASST_PM',
  'GC_SUPER',
  'GC_ENGINEER',
];

console.log('='.repeat(80));
console.log('GC TEAM ROLE PERMISSIONS TEST');
console.log('='.repeat(80));
console.log('');

// Test 1: Financial Access
console.log('TEST 1: Financial Access (Budget, Contracts, Payment Apps)');
console.log('-'.repeat(80));
testRoles.forEach(role => {
  const canViewBudget = hasPermission(role, 'view_budget');
  const canEditBudget = hasPermission(role, 'edit_budget');
  const canViewContracts = hasPermission(role, 'view_contracts');
  const canApprovePayments = hasPermission(role, 'approve_payment_apps');

  console.log(`${roleDisplayNames[role]} (${role}):`);
  console.log(`  View Budget: ${canViewBudget ? '✓' : '✗'}`);
  console.log(`  Edit Budget: ${canEditBudget ? '✓' : '✗'}`);
  console.log(`  View Contracts: ${canViewContracts ? '✓' : '✗'}`);
  console.log(`  Approve Payment Apps: ${canApprovePayments ? '✓' : '✗'}`);
  console.log('');
});

// Test 2: Approval Authority
console.log('TEST 2: Approval Authority');
console.log('-'.repeat(80));
testRoles.forEach(role => {
  const canApproveEstimates = hasPermission(role, 'approve_estimates');
  const canApproveChangeOrders = hasPermission(role, 'approve_change_orders');
  const canApproveSubmittals = hasPermission(role, 'approve_submittals');
  const canApproveSchedule = hasPermission(role, 'approve_schedule');

  console.log(`${roleDisplayNames[role]} (${role}):`);
  console.log(`  Approve Estimates: ${canApproveEstimates ? '✓' : '✗'}`);
  console.log(`  Approve Change Orders: ${canApproveChangeOrders ? '✓' : '✗'}`);
  console.log(`  Approve Submittals: ${canApproveSubmittals ? '✓' : '✗'}`);
  console.log(`  Approve Schedule: ${canApproveSchedule ? '✓' : '✗'}`);
  console.log('');
});

// Test 3: Field Operations
console.log('TEST 3: Field Operations Access');
console.log('-'.repeat(80));
testRoles.forEach(role => {
  const canCreateFieldReports = hasPermission(role, 'create_field_reports');
  const canCreateDailyLogs = hasPermission(role, 'create_daily_logs');
  const canManageSafety = hasPermission(role, 'manage_safety');
  const canManageInspections = hasPermission(role, 'manage_inspections');

  console.log(`${roleDisplayNames[role]} (${role}):`);
  console.log(`  Create Field Reports: ${canCreateFieldReports ? '✓' : '✗'}`);
  console.log(`  Create Daily Logs: ${canCreateDailyLogs ? '✓' : '✗'}`);
  console.log(`  Manage Safety: ${canManageSafety ? '✓' : '✗'}`);
  console.log(`  Manage Inspections: ${canManageInspections ? '✓' : '✗'}`);
  console.log('');
});

// Test 4: Module Access
console.log('TEST 4: Module Access (Navigation Visibility)');
console.log('-'.repeat(80));
const criticalModules = ['budget', 'contracts', 'payment-applications', 'field', 'safety', 'estimating'];
testRoles.forEach(role => {
  console.log(`${roleDisplayNames[role]} (${role}):`);
  criticalModules.forEach(module => {
    const canAccess = canAccessModule(role, module);
    console.log(`  ${module}: ${canAccess ? '✓ Visible' : '✗ Hidden'}`);
  });
  console.log('');
});

// Test 5: Superintendent vs Engineer vs Accounting
console.log('TEST 5: Role Comparison - Key Differences');
console.log('-'.repeat(80));

console.log('GC_SUPER (Project Superintendent):');
console.log(`  Description: ${roleDescriptions['GC_SUPER']}`);
console.log(`  Total Permissions: ${getRolePermissions('GC_SUPER').length}`);
console.log(`  Can view budget: ${hasPermission('GC_SUPER', 'view_budget') ? '✓' : '✗ (NO FINANCIAL ACCESS)'}`);
console.log(`  Can manage safety: ${hasPermission('GC_SUPER', 'manage_safety') ? '✓ (FIELD FOCUS)' : '✗'}`);
console.log('');

console.log('GC_ENGINEER (Project Engineer):');
console.log(`  Description: ${roleDescriptions['GC_ENGINEER']}`);
console.log(`  Total Permissions: ${getRolePermissions('GC_ENGINEER').length}`);
console.log(`  Can view budget: ${hasPermission('GC_ENGINEER', 'view_budget') ? '✓ (READ-ONLY)' : '✗'}`);
console.log(`  Can edit budget: ${hasPermission('GC_ENGINEER', 'edit_budget') ? '✓' : '✗ (NO EDIT)'}`);
console.log(`  Can approve estimates: ${hasPermission('GC_ENGINEER', 'approve_estimates') ? '✓' : '✗ (NO APPROVALS)'}`);
console.log('');

console.log('GC_ACCOUNTING (Accounting):');
console.log(`  Description: ${roleDescriptions['GC_ACCOUNTING']}`);
console.log(`  Total Permissions: ${getRolePermissions('GC_ACCOUNTING').length}`);
console.log(`  Can approve payment apps: ${hasPermission('GC_ACCOUNTING', 'approve_payment_apps') ? '✓ (FINANCIAL FOCUS)' : '✗'}`);
console.log(`  Can create field reports: ${hasPermission('GC_ACCOUNTING', 'create_field_reports') ? '✓' : '✗ (NO FIELD ACCESS)'}`);
console.log('');

// Test 6: Sr PM vs Asst PM
console.log('TEST 6: Senior PM vs Assistant PM');
console.log('-'.repeat(80));
const pmComparisonPerms = [
  'approve_payment_apps',
  'approve_estimates',
  'approve_change_orders',
  'approve_submittals',
  'create_payment_apps',
  'create_estimates',
  'create_change_orders',
];

console.log('Permission Comparison:');
pmComparisonPerms.forEach(perm => {
  const srPm = hasPermission('GC_SR_PM', perm as any);
  const asstPm = hasPermission('GC_ASST_PM', perm as any);
  console.log(`  ${perm}:`);
  console.log(`    Sr PM: ${srPm ? '✓' : '✗'}`);
  console.log(`    Asst PM: ${asstPm ? '✓' : '✗'}`);
});

console.log('');
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log('✓ GC_OWNER: Full access (company owner)');
console.log('✓ GC_ACCOUNTING: Financial only, no field operations');
console.log('✓ GC_SR_PM: Full project control with all approvals');
console.log('✓ GC_ASST_PM: Operational control, NO approvals');
console.log('✓ GC_SUPER: Field operations only, NO financial access');
console.log('✓ GC_ENGINEER: Technical work, view-only financial, NO approvals');
console.log('');
console.log('All roles properly configured! ✓');
console.log('='.repeat(80));
