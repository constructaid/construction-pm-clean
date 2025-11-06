/**
 * Role-Based Access Control (RBAC) System
 * Construction Industry Standard Permissions
 */

export type UserRole = 'OWNER' | 'ARCHITECT' | 'GC' | 'SUB' | 'ADMIN' | 'FIELD_SUPER' | 'PROJECT_MANAGER' | 'ESTIMATOR';

export type Permission =
  // Project Management
  | 'view_project_info'
  | 'edit_project_info'
  | 'delete_project'
  | 'manage_team'

  // Financial
  | 'view_budget'
  | 'edit_budget'
  | 'view_costs'
  | 'view_contracts'
  | 'edit_contracts'
  | 'view_payment_apps'
  | 'create_payment_apps'
  | 'approve_payment_apps'

  // Estimating & Bidding
  | 'view_estimates'
  | 'create_estimates'
  | 'edit_estimates'
  | 'approve_estimates'
  | 'view_bid_packages'
  | 'create_bid_packages'
  | 'manage_quotes'

  // Change Management
  | 'view_change_orders'
  | 'create_change_orders'
  | 'approve_change_orders'

  // Schedule
  | 'view_schedule'
  | 'edit_schedule'
  | 'approve_schedule'

  // Documents & Plans
  | 'view_plans'
  | 'upload_plans'
  | 'view_documents'
  | 'upload_documents'
  | 'delete_documents'

  // RFIs & Submittals
  | 'view_rfis'
  | 'create_rfis'
  | 'respond_rfis'
  | 'view_submittals'
  | 'create_submittals'
  | 'review_submittals'
  | 'approve_submittals'

  // Field Operations
  | 'view_field_reports'
  | 'create_field_reports'
  | 'view_daily_logs'
  | 'create_daily_logs'
  | 'manage_inspections'

  // Safety
  | 'view_safety'
  | 'create_safety_reports'
  | 'manage_safety'

  // Tasks
  | 'view_tasks'
  | 'create_tasks'
  | 'assign_tasks'
  | 'complete_tasks'

  // Contacts
  | 'view_contacts'
  | 'manage_contacts';

/**
 * Construction Industry Role-Based Permissions Matrix
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  // OWNER - Full visibility except field operations details
  OWNER: [
    'view_project_info',
    'edit_project_info',
    'view_budget',
    'view_costs',
    'view_contracts',
    'view_payment_apps',
    'approve_payment_apps',
    'view_estimates',
    'approve_estimates',
    'view_bid_packages',
    'view_change_orders',
    'approve_change_orders',
    'view_schedule',
    'view_plans',
    'view_documents',
    'view_rfis',
    'view_submittals',
    'approve_submittals',
    'view_field_reports',
    'view_safety',
    'view_tasks',
    'view_contacts',
  ],

  // ARCHITECT - Design, submittals, RFIs, no financial access
  ARCHITECT: [
    'view_project_info',
    'view_schedule',
    'view_plans',
    'upload_plans',
    'view_documents',
    'upload_documents',
    'view_rfis',
    'create_rfis',
    'respond_rfis',
    'view_submittals',
    'review_submittals',
    'approve_submittals',
    'view_change_orders', // Can view but not approve
    'view_tasks',
    'create_tasks',
    'view_contacts',
    'view_field_reports', // Can see progress
  ],

  // GENERAL CONTRACTOR (GC) - Full project control
  GC: [
    'view_project_info',
    'edit_project_info',
    'manage_team',
    'view_budget',
    'edit_budget',
    'view_costs',
    'view_contracts',
    'edit_contracts',
    'view_payment_apps',
    'create_payment_apps',
    'view_estimates',
    'create_estimates',
    'edit_estimates',
    'approve_estimates',
    'view_bid_packages',
    'create_bid_packages',
    'manage_quotes',
    'view_change_orders',
    'create_change_orders',
    'approve_change_orders',
    'view_schedule',
    'edit_schedule',
    'approve_schedule',
    'view_plans',
    'upload_plans',
    'view_documents',
    'upload_documents',
    'delete_documents',
    'view_rfis',
    'create_rfis',
    'respond_rfis',
    'view_submittals',
    'create_submittals',
    'review_submittals',
    'approve_submittals',
    'view_field_reports',
    'create_field_reports',
    'view_daily_logs',
    'create_daily_logs',
    'manage_inspections',
    'view_safety',
    'create_safety_reports',
    'manage_safety',
    'view_tasks',
    'create_tasks',
    'assign_tasks',
    'complete_tasks',
    'view_contacts',
    'manage_contacts',
  ],

  // SUBCONTRACTOR (SUB) - Limited to their scope of work
  SUB: [
    'view_project_info',
    'view_schedule',
    'view_plans',
    'view_documents',
    'upload_documents', // For their deliverables
    'view_rfis',
    'create_rfis',
    'view_submittals',
    'create_submittals',
    'view_change_orders', // For their scope only
    'view_field_reports',
    'create_field_reports', // Their own reports
    'view_safety',
    'create_safety_reports',
    'view_tasks', // Their assigned tasks
    'complete_tasks',
    'view_contacts',
  ],

  // ADMIN - System administration and full access
  ADMIN: [
    'view_project_info',
    'edit_project_info',
    'delete_project',
    'manage_team',
    'view_budget',
    'edit_budget',
    'view_costs',
    'view_contracts',
    'edit_contracts',
    'view_payment_apps',
    'create_payment_apps',
    'approve_payment_apps',
    'view_estimates',
    'create_estimates',
    'edit_estimates',
    'approve_estimates',
    'view_bid_packages',
    'create_bid_packages',
    'manage_quotes',
    'view_change_orders',
    'create_change_orders',
    'approve_change_orders',
    'view_schedule',
    'edit_schedule',
    'approve_schedule',
    'view_plans',
    'upload_plans',
    'view_documents',
    'upload_documents',
    'delete_documents',
    'view_rfis',
    'create_rfis',
    'respond_rfis',
    'view_submittals',
    'create_submittals',
    'review_submittals',
    'approve_submittals',
    'view_field_reports',
    'create_field_reports',
    'view_daily_logs',
    'create_daily_logs',
    'manage_inspections',
    'view_safety',
    'create_safety_reports',
    'manage_safety',
    'view_tasks',
    'create_tasks',
    'assign_tasks',
    'complete_tasks',
    'view_contacts',
    'manage_contacts',
  ],

  // FIELD SUPERINTENDENT - Field operations, safety, no financial access
  FIELD_SUPER: [
    'view_project_info',
    'view_schedule',
    'edit_schedule', // Update actual progress
    'view_plans',
    'view_documents',
    'upload_documents', // Field photos, reports
    'view_rfis',
    'create_rfis',
    'view_submittals',
    'view_change_orders', // Awareness of changes
    'view_field_reports',
    'create_field_reports',
    'view_daily_logs',
    'create_daily_logs',
    'manage_inspections',
    'view_safety',
    'create_safety_reports',
    'manage_safety',
    'view_tasks',
    'create_tasks',
    'assign_tasks',
    'complete_tasks',
    'view_contacts',
  ],

  // PROJECT MANAGER - Full operational control, limited financial approval
  PROJECT_MANAGER: [
    'view_project_info',
    'edit_project_info',
    'manage_team',
    'view_budget',
    'view_costs',
    'view_contracts',
    'view_payment_apps',
    'create_payment_apps',
    'view_estimates',
    'create_estimates',
    'edit_estimates',
    'view_bid_packages',
    'create_bid_packages',
    'manage_quotes',
    'view_change_orders',
    'create_change_orders',
    'view_schedule',
    'edit_schedule',
    'view_plans',
    'upload_plans',
    'view_documents',
    'upload_documents',
    'delete_documents',
    'view_rfis',
    'create_rfis',
    'respond_rfis',
    'view_submittals',
    'create_submittals',
    'review_submittals',
    'view_field_reports',
    'create_field_reports',
    'view_daily_logs',
    'create_daily_logs',
    'manage_inspections',
    'view_safety',
    'create_safety_reports',
    'manage_safety',
    'view_tasks',
    'create_tasks',
    'assign_tasks',
    'complete_tasks',
    'view_contacts',
    'manage_contacts',
  ],

  // ESTIMATOR - Estimating, bidding, costs (pre-construction phase)
  ESTIMATOR: [
    'view_project_info',
    'view_costs',
    'view_estimates',
    'create_estimates',
    'edit_estimates',
    'view_bid_packages',
    'create_bid_packages',
    'manage_quotes',
    'view_plans',
    'view_documents',
    'view_schedule',
    'view_contacts',
    'view_tasks',
  ],
};

/**
 * Module-to-Permission mapping for navigation visibility
 */
export const modulePermissions: Record<string, Permission[]> = {
  'project-info': ['view_project_info'],
  'team': ['manage_team'],
  'tasks': ['view_tasks'],
  'rfis': ['view_rfis'],
  'submittals': ['view_submittals'],
  'schedule': ['view_schedule'],
  'change-orders': ['view_change_orders'],
  'payment-applications': ['view_payment_apps'],
  'contracts': ['view_contracts'],
  'contacts': ['view_contacts'],
  'budget': ['view_budget'],
  'estimating': ['view_estimates'],
  'bid-packages': ['view_bid_packages'],
  'documents': ['view_documents'],
  'files': ['view_documents'],
  'field': ['view_field_reports'],
  'safety': ['view_safety'],
  'plans': ['view_plans'],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a user role has ANY of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user role has ALL of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a user role can access a specific module
 */
export function canAccessModule(role: UserRole, moduleKey: string): boolean {
  const requiredPermissions = modulePermissions[moduleKey];
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // No permissions required
  }
  return hasAnyPermission(role, requiredPermissions);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Get filtered modules based on role permissions
 */
export function getAccessibleModules(role: UserRole, allModules: string[]): string[] {
  return allModules.filter(module => canAccessModule(role, module));
}

/**
 * Permission descriptions for UI display
 */
export const permissionDescriptions: Record<Permission, string> = {
  view_project_info: 'View project information and details',
  edit_project_info: 'Edit project information and settings',
  delete_project: 'Delete projects',
  manage_team: 'Add/remove team members and manage permissions',
  view_budget: 'View project budget and financial tracking',
  edit_budget: 'Edit project budget allocations',
  view_costs: 'View project costs and expenditures',
  view_contracts: 'View contracts and agreements',
  edit_contracts: 'Create and edit contracts',
  view_payment_apps: 'View payment applications',
  create_payment_apps: 'Create and submit payment applications',
  approve_payment_apps: 'Approve payment applications',
  view_estimates: 'View cost estimates',
  create_estimates: 'Create new cost estimates',
  edit_estimates: 'Edit existing cost estimates',
  approve_estimates: 'Approve cost estimates',
  view_bid_packages: 'View bid packages',
  create_bid_packages: 'Create and manage bid packages',
  manage_quotes: 'Manage subcontractor quotes',
  view_change_orders: 'View change orders',
  create_change_orders: 'Create change order requests',
  approve_change_orders: 'Approve change orders',
  view_schedule: 'View project schedule',
  edit_schedule: 'Edit project schedule',
  approve_schedule: 'Approve schedule changes',
  view_plans: 'View construction plans and drawings',
  upload_plans: 'Upload construction plans',
  view_documents: 'View project documents',
  upload_documents: 'Upload project documents',
  delete_documents: 'Delete project documents',
  view_rfis: 'View RFIs (Requests for Information)',
  create_rfis: 'Create new RFIs',
  respond_rfis: 'Respond to RFIs',
  view_submittals: 'View submittals',
  create_submittals: 'Create and submit submittals',
  review_submittals: 'Review submittals',
  approve_submittals: 'Approve submittals',
  view_field_reports: 'View field reports',
  create_field_reports: 'Create field reports',
  view_daily_logs: 'View daily logs',
  create_daily_logs: 'Create daily logs',
  manage_inspections: 'Manage inspections',
  view_safety: 'View safety reports and documentation',
  create_safety_reports: 'Create safety reports',
  manage_safety: 'Manage safety programs and compliance',
  view_tasks: 'View tasks and action items',
  create_tasks: 'Create new tasks',
  assign_tasks: 'Assign tasks to team members',
  complete_tasks: 'Mark tasks as complete',
  view_contacts: 'View project contacts',
  manage_contacts: 'Add and edit project contacts',
};
