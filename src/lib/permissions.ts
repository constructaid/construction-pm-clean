/**
 * Role-Based Access Control (RBAC) System
 * Construction Industry Standard Permissions
 */

// Base roles for external parties
export type ExternalRole = 'OWNER' | 'ARCHITECT' | 'SUB';

// GC Team roles with hierarchy
export type GCTeamRole =
  | 'GC_OWNER'              // GC Company Owner - Full access
  | 'GC_ACCOUNTING'         // Accounting - Financial focus, limited operations
  | 'GC_SR_PM'              // Senior Project Manager - Full project control with approvals
  | 'GC_ASST_PM'            // Assistant Project Manager - Operations, limited approvals
  | 'GC_SUPER'              // Project Superintendent - Field operations, no financial
  | 'GC_ENGINEER';          // Project Engineer - Technical/coordination, no financial approvals

// Legacy/backwards compatibility roles
export type LegacyRole = 'GC' | 'FIELD_SUPER' | 'PROJECT_MANAGER';

// Other specialized roles
export type SpecializedRole = 'ADMIN' | 'ESTIMATOR';

// Combined role type
export type UserRole = ExternalRole | GCTeamRole | LegacyRole | SpecializedRole;

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
  // CLIENT OWNER - Full visibility except field operations details
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
    'view_change_orders',
    'view_tasks',
    'create_tasks',
    'view_contacts',
    'view_field_reports',
  ],

  // SUBCONTRACTOR (SUB) - Limited to their scope of work
  SUB: [
    'view_project_info',
    'view_schedule',
    'view_plans',
    'view_documents',
    'upload_documents',
    'view_rfis',
    'create_rfis',
    'view_submittals',
    'create_submittals',
    'view_change_orders',
    'view_field_reports',
    'create_field_reports',
    'view_safety',
    'create_safety_reports',
    'view_tasks',
    'complete_tasks',
    'view_contacts',
  ],

  // ===== GC TEAM ROLES =====

  // GC_OWNER - GC Company Owner - Full access to everything
  GC_OWNER: [
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

  // GC_ACCOUNTING - Financial focus, limited to accounting tasks
  GC_ACCOUNTING: [
    'view_project_info',
    'view_budget',
    'edit_budget',
    'view_costs',
    'view_contracts',
    'edit_contracts',
    'view_payment_apps',
    'create_payment_apps',
    'approve_payment_apps',
    'view_estimates',
    'view_change_orders',
    'approve_change_orders', // For cost impact
    'view_schedule', // For billing milestones
    'view_documents',
    'view_contacts',
    'view_tasks',
    // NOTABLY MISSING: Field operations, RFIs, submittals, safety, daily logs
  ],

  // GC_SR_PM - Senior Project Manager - Full project control with all approvals
  GC_SR_PM: [
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

  // GC_ASST_PM - Assistant Project Manager - Operations, limited financial approvals
  GC_ASST_PM: [
    'view_project_info',
    'edit_project_info',
    'manage_team',
    'view_budget',
    'view_costs',
    'view_contracts',
    'view_payment_apps',
    'create_payment_apps', // Can create but not approve
    'view_estimates',
    'create_estimates',
    'edit_estimates',
    // NO approve_estimates
    'view_bid_packages',
    'create_bid_packages',
    'manage_quotes',
    'view_change_orders',
    'create_change_orders',
    // NO approve_change_orders (Sr PM must approve)
    'view_schedule',
    'edit_schedule',
    // NO approve_schedule
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
    // NO approve_submittals
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

  // GC_SUPER - Project Superintendent - Field operations, safety, NO financial access
  GC_SUPER: [
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
    // NOTABLY MISSING: view_budget, view_contracts, view_payment_apps, edit_budget, approve anything
  ],

  // GC_ENGINEER - Project Engineer - Technical coordination, no financial approvals
  GC_ENGINEER: [
    'view_project_info',
    'edit_project_info', // For technical details
    'view_budget', // Can see budget
    'view_costs', // Track costs
    'view_contracts', // Read contracts for scope
    // NO edit_budget, edit_contracts
    'view_payment_apps',
    // NO create or approve payment apps
    'view_estimates',
    'create_estimates',
    'edit_estimates',
    // NO approve_estimates
    'view_bid_packages',
    'create_bid_packages',
    'manage_quotes',
    'view_change_orders',
    'create_change_orders',
    // NO approve_change_orders
    'view_schedule',
    'edit_schedule',
    // NO approve_schedule
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
    // NO approve_submittals
    'view_field_reports',
    'create_field_reports',
    'view_daily_logs',
    'create_daily_logs',
    'manage_inspections',
    'view_safety',
    'create_safety_reports',
    'view_tasks',
    'create_tasks',
    'assign_tasks',
    'complete_tasks',
    'view_contacts',
    'manage_contacts',
  ],

  // ===== LEGACY ROLES (for backwards compatibility) =====

  // GENERAL CONTRACTOR (GC) - Legacy role, maps to GC_SR_PM
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

  // FIELD SUPERINTENDENT - Legacy role, maps to GC_SUPER
  FIELD_SUPER: [
    'view_project_info',
    'view_schedule',
    'edit_schedule',
    'view_plans',
    'view_documents',
    'upload_documents',
    'view_rfis',
    'create_rfis',
    'view_submittals',
    'view_change_orders',
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

  // PROJECT MANAGER - Legacy role, maps to GC_SR_PM
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

  // ===== SPECIALIZED ROLES =====

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

/**
 * Role display names for UI
 */
export const roleDisplayNames: Record<UserRole, string> = {
  // External
  OWNER: 'Client Owner',
  ARCHITECT: 'Architect',
  SUB: 'Subcontractor',

  // GC Team
  GC_OWNER: 'GC Owner',
  GC_ACCOUNTING: 'Accounting',
  GC_SR_PM: 'Senior Project Manager',
  GC_ASST_PM: 'Assistant Project Manager',
  GC_SUPER: 'Project Superintendent',
  GC_ENGINEER: 'Project Engineer',

  // Legacy
  GC: 'General Contractor',
  FIELD_SUPER: 'Field Superintendent',
  PROJECT_MANAGER: 'Project Manager',

  // Specialized
  ADMIN: 'System Administrator',
  ESTIMATOR: 'Estimator',
};

/**
 * Role descriptions for UI
 */
export const roleDescriptions: Record<UserRole, string> = {
  // External
  OWNER: 'Project owner with oversight and approval authority',
  ARCHITECT: 'Design professional managing plans, RFIs, and submittals',
  SUB: 'Subcontractor with limited scope-specific access',

  // GC Team
  GC_OWNER: 'GC company owner with full access to all projects and functions',
  GC_ACCOUNTING: 'Accounting staff with financial access (budgets, contracts, payment apps)',
  GC_SR_PM: 'Senior PM with full project control and approval authority',
  GC_ASST_PM: 'Assistant PM with operational control but limited approval authority',
  GC_SUPER: 'Field superintendent focused on operations, safety, and schedule (no financial access)',
  GC_ENGINEER: 'Project engineer handling technical coordination and documentation (no approval authority)',

  // Legacy
  GC: 'General contractor (legacy role)',
  FIELD_SUPER: 'Field superintendent (legacy role)',
  PROJECT_MANAGER: 'Project manager (legacy role)',

  // Specialized
  ADMIN: 'System administrator with full access',
  ESTIMATOR: 'Estimator focused on pre-construction and bidding',
};

// ========================================
// MODULE-BASED ACCESS CONTROL
// ========================================

/**
 * Interface for user with company context
 */
export interface UserWithCompany {
  id: number;
  email: string;
  role: UserRole;
  companyId: number;
  companyType?: string;
}

/**
 * Check if user has access to a specific add-on module
 * Modules are optional features that companies can subscribe to
 */
export function hasModuleAccess(
  user: UserWithCompany | null,
  moduleName: string,
  enabledModules?: string[]
): boolean {
  if (!user) return false;

  // Get enabled modules (mock for now - will query DB in production)
  const modules = enabledModules || getMockEnabledModules(user.companyId);

  return modules.includes(moduleName);
}

/**
 * Check if user is internal (GC employee) vs external (sub, owner, etc.)
 */
export function isInternalUser(user: UserWithCompany | null): boolean {
  if (!user) return false;

  const internalRoles: UserRole[] = [
    'ADMIN',
    'GC',
    'GC_OWNER',
    'GC_ACCOUNTING',
    'GC_SR_PM',
    'GC_ASST_PM',
    'GC_SUPER',
    'GC_ENGINEER',
    'PROJECT_MANAGER',
    'FIELD_SUPER',
    'ESTIMATOR',
  ];

  return internalRoles.includes(user.role);
}

/**
 * Check if user is external stakeholder (owner, architect, sub)
 */
export function isExternalUser(user: UserWithCompany | null): boolean {
  if (!user) return false;

  const externalRoles: UserRole[] = ['OWNER', 'ARCHITECT', 'SUB'];
  return externalRoles.includes(user.role);
}

/**
 * Check if user can access HR module
 * HR is only for internal GC users with HR module enabled
 */
export function canAccessHR(user: UserWithCompany | null, enabledModules?: string[]): boolean {
  if (!user) return false;

  // Must be internal user
  if (!isInternalUser(user)) return false;

  // Must have HR module enabled
  if (!hasModuleAccess(user, 'hr', enabledModules)) return false;

  // All internal users can access HR (at least self-service)
  return true;
}

/**
 * Check if user can manage (add/edit/delete) employees
 */
export function canManageEmployees(user: UserWithCompany | null): boolean {
  if (!user) return false;

  const managerRoles: UserRole[] = ['ADMIN', 'GC_OWNER', 'GC_ACCOUNTING'];
  return managerRoles.includes(user.role);
}

/**
 * Check if user can approve PTO requests
 */
export function canApprovePTO(user: UserWithCompany | null): boolean {
  if (!user) return false;

  const approverRoles: UserRole[] = [
    'ADMIN',
    'GC_OWNER',
    'GC_SR_PM',
    'GC_ASST_PM',
  ];
  return approverRoles.includes(user.role);
}

/**
 * Check if user can view other employees' data
 */
export function canViewEmployeeData(user: UserWithCompany | null, targetEmployeeId?: number): boolean {
  if (!user) return false;

  // Admins and owners can see all
  if (['ADMIN', 'GC_OWNER', 'GC_ACCOUNTING'].includes(user.role)) {
    return true;
  }

  // Managers can see their direct reports (would need DB query in production)
  if (['GC_SR_PM', 'GC_ASST_PM', 'GC_SUPER'].includes(user.role)) {
    // For now, return true - in production, check if user is manager of targetEmployeeId
    return true;
  }

  // Regular employees can only see themselves
  if (targetEmployeeId) {
    return user.id === targetEmployeeId;
  }

  return false;
}

/**
 * Mock function to get enabled modules for a company
 * In production, this would query the database
 */
function getMockEnabledModules(companyId: number): string[] {
  // For demo, company 1 has HR module enabled (in trial)
  if (companyId === 1) {
    return ['hr', 'advanced_reporting'];
  }

  // Other companies have no modules by default
  return [];
}

/**
 * Get navigation items based on user permissions and enabled modules
 */
export function getNavigationItems(
  user: UserWithCompany | null,
  enabledModules?: string[]
): NavigationItem[] {
  if (!user) return [];

  const items: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      show: true,
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: '🏗️',
      show: true,
    },
  ];

  // HR - only for internal users with HR module
  if (canAccessHR(user, enabledModules)) {
    items.push({
      name: 'HR',
      href: '/hr',
      icon: '👥',
      show: true,
      badge: 'TRIAL', // Could be dynamic based on subscription status
    });
  }

  // Reports
  items.push({
    name: 'Reports',
    href: '/reports',
    icon: '📈',
    show: true,
  });

  // Settings - for admins and GC owners
  if (['ADMIN', 'GC_OWNER'].includes(user.role)) {
    items.push({
      name: 'Settings',
      href: '/settings',
      icon: '⚙️',
      show: true,
    });
  }

  return items.filter(item => item.show);
}

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  show: boolean;
  badge?: string;
}
