/**
 * Data Filtering Middleware
 * Filters sensitive data based on user permissions
 *
 * Usage:
 * - filterFinancialData(project, permissions)
 * - filterByScopeAccess(items, teamMember)
 */

import type { ProjectPermissions } from './rbac';

/**
 * Filter financial data from project objects
 * Removes budget fields if user doesn't have financial permissions
 */
export function filterFinancialData<T extends Record<string, any>>(
  data: T,
  permissions: ProjectPermissions
): T {
  if (permissions.canManageFinancials) {
    return data; // User can see everything
  }

  // Create a copy and remove financial fields
  const filtered = { ...data };

  // List of financial fields to remove
  const financialFields = [
    'totalBudget',
    'spentBudget',
    'allocatedBudget',
    'committedBudget',
    'remainingBudget',
    'baseContractAmount',
    'clientContingency',
    'contingencyUsed',
    'contingencyRemaining',
    'proposedAmount',
    'approvedAmount',
    'costImpact',
    'originalCost',
    'revisedCost',
    'estimatedCost',
    'actualCost',
    'contractAmount',
    'retentionAmount',
    'amountDue',
  ];

  // Remove each financial field
  financialFields.forEach(field => {
    if (field in filtered) {
      delete filtered[field];
    }
  });

  return filtered;
}

/**
 * Filter array of objects by financial permissions
 */
export function filterFinancialDataArray<T extends Record<string, any>>(
  items: T[],
  permissions: ProjectPermissions
): T[] {
  if (permissions.canManageFinancials) {
    return items;
  }

  return items.map(item => filterFinancialData(item, permissions));
}

/**
 * Filter data by scope access (for subcontractors)
 * Only returns items matching the user's CSI division
 */
export function filterByScope<T extends { csiDivision?: string | null }>(
  items: T[],
  teamMember: { teamRole: string; csiDivision?: string | null } | null
): T[] {
  // If not a subcontractor, return all items
  if (!teamMember || teamMember.teamRole !== 'subcontractor') {
    return items;
  }

  // If subcontractor has no division assigned, return all (fallback)
  if (!teamMember.csiDivision) {
    return items;
  }

  // Filter to only items in this sub's division
  return items.filter(item => {
    // If item has no division, show it (general project item)
    if (!item.csiDivision) {
      return true;
    }

    // Only show items matching sub's division
    return item.csiDivision === teamMember.csiDivision;
  });
}

/**
 * Check if user can access a specific scope
 * Used for single-item access checks
 */
export function canAccessScope(
  itemCsiDivision: string | null | undefined,
  teamMember: { teamRole: string; csiDivision?: string | null } | null
): boolean {
  // Non-subs can access all scopes
  if (!teamMember || teamMember.teamRole !== 'subcontractor') {
    return true;
  }

  // Items with no division are accessible to all
  if (!itemCsiDivision) {
    return true;
  }

  // Subs with no division can access all (fallback)
  if (!teamMember.csiDivision) {
    return true;
  }

  // Check if divisions match
  return itemCsiDivision === teamMember.csiDivision;
}

/**
 * Sanitize user data for API responses
 * Removes sensitive fields like passwords, tokens, etc.
 */
export function sanitizeUser(user: any) {
  const sanitized = { ...user };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.emailVerificationToken;
  delete sanitized.passwordResetToken;
  delete sanitized.twoFactorSecret;

  return sanitized;
}

/**
 * Filter project data based on team member access level
 * Removes sensitive fields for read-only or standard access
 */
export function filterByAccessLevel<T extends Record<string, any>>(
  data: T,
  accessLevel: string = 'standard'
): T {
  if (accessLevel === 'admin') {
    return data; // Admins see everything
  }

  const filtered = { ...data };

  if (accessLevel === 'read_only') {
    // Read-only users don't see internal notes, private comments, etc.
    delete filtered.internalNotes;
    delete filtered.privateComments;
    delete filtered.confidentialAttachments;
  }

  return filtered;
}

/**
 * Helper to check if a document should be visible to user
 * Based on document confidentiality level and user permissions
 */
export function canViewDocument(
  document: { confidentialityLevel?: string; csiDivision?: string },
  permissions: ProjectPermissions,
  teamMember: { teamRole: string; csiDivision?: string | null } | null
): boolean {
  // Check confidentiality level
  if (document.confidentialityLevel === 'owner_only') {
    return permissions.canManageFinancials; // Only owner/GC with financial access
  }

  if (document.confidentialityLevel === 'gc_only') {
    return teamMember?.teamRole === 'general_contractor' ||
           teamMember?.teamRole === 'owner' ||
           permissions.canManageTeam;
  }

  // Check scope access for division-specific documents
  if (document.csiDivision) {
    return canAccessScope(document.csiDivision, teamMember);
  }

  // Public documents visible to all team members
  return true;
}
