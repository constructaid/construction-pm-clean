/**
 * Multi-Tenancy Helper Functions
 *
 * Provides utilities for enforcing company-level data isolation in the application.
 * All tenant-scoped queries should use these helpers to ensure proper data isolation.
 */

import { db } from './index';
import { eq, and, sql } from 'drizzle-orm';
import { projects, projectTeamMembers, users } from './schema';
import type { User } from './schema';

export interface TenantUser {
  id: number;
  email: string;
  role: string;
  companyId: number | null;
}

/**
 * Verifies that a user belongs to a specific company
 * Returns true if the user belongs to the company, false otherwise
 */
export async function verifyCompanyMembership(
  userId: number,
  companyId: number
): Promise<boolean> {
  const result = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.companyId, companyId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Verifies that a user has access to a specific project
 * Access is granted if:
 * 1. The user is the project owner
 * 2. The user is the general contractor
 * 3. The user is a team member
 * 4. The user belongs to the same company (for company-wide projects)
 */
export async function verifyProjectAccess(
  userId: number,
  projectId: number,
  userCompanyId?: number | null
): Promise<{ hasAccess: boolean; project?: typeof projects.$inferSelect }> {
  // First, check if user is directly associated with the project
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project.length) {
    return { hasAccess: false };
  }

  const proj = project[0];

  // Check direct ownership or team association
  if (
    proj.ownerId === userId ||
    proj.generalContractorId === userId ||
    proj.createdBy === userId
  ) {
    return { hasAccess: true, project: proj };
  }

  // Check if user is in teamMembers JSON array
  const teamMembersArray = (proj.teamMembers as number[]) || [];
  if (teamMembersArray.includes(userId)) {
    return { hasAccess: true, project: proj };
  }

  // Check project team members table
  const teamMember = await db
    .select()
    .from(projectTeamMembers)
    .where(
      and(
        eq(projectTeamMembers.projectId, projectId),
        eq(projectTeamMembers.userId, userId),
        eq(projectTeamMembers.isActive, true)
      )
    )
    .limit(1);

  if (teamMember.length > 0) {
    return { hasAccess: true, project: proj };
  }

  // Check company membership (for company-wide access)
  if (userCompanyId && proj.companyId === userCompanyId) {
    return { hasAccess: true, project: proj };
  }

  return { hasAccess: false };
}

/**
 * Gets all project IDs that a user has access to
 * Useful for filtering queries across multiple projects
 */
export async function getAccessibleProjectIds(
  userId: number,
  companyId?: number | null
): Promise<number[]> {
  // Get projects where user is owner, GC, creator, or in team
  const directAccess = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      sql`(
        ${projects.ownerId} = ${userId} OR
        ${projects.generalContractorId} = ${userId} OR
        ${projects.createdBy} = ${userId} OR
        ${projects.teamMembers}::jsonb @> ${JSON.stringify([userId])}
        ${companyId ? sql`OR ${projects.companyId} = ${companyId}` : sql``}
      )`
    );

  // Get projects from team membership table
  const teamAccess = await db
    .select({ projectId: projectTeamMembers.projectId })
    .from(projectTeamMembers)
    .where(
      and(
        eq(projectTeamMembers.userId, userId),
        eq(projectTeamMembers.isActive, true)
      )
    );

  // Combine and deduplicate
  const projectIds = new Set<number>();
  directAccess.forEach((p) => projectIds.add(p.id));
  teamAccess.forEach((p) => projectIds.add(p.projectId));

  return Array.from(projectIds);
}

/**
 * Creates a company filter condition for queries
 * Use this in .where() clauses
 */
export function companyFilter(tableCompanyId: any, userCompanyId: number | null | undefined) {
  if (!userCompanyId) {
    // If user has no company, they can only see their own data (handled separately)
    return sql`1 = 0`; // Always false - no company access
  }
  return eq(tableCompanyId, userCompanyId);
}

/**
 * Validates that the user can perform operations on company-scoped resources
 * Throws ForbiddenError if access is denied
 */
export function requireCompanyAccess(
  user: TenantUser | undefined,
  resourceCompanyId: number | null | undefined
): void {
  if (!user) {
    throw new Error('Authentication required');
  }

  if (!user.companyId) {
    throw new Error('User not associated with a company');
  }

  if (resourceCompanyId && resourceCompanyId !== user.companyId) {
    throw new Error('Access denied: resource belongs to different company');
  }
}

/**
 * Gets the company ID from a project
 */
export async function getProjectCompanyId(projectId: number): Promise<number | null> {
  const result = await db
    .select({ companyId: projects.companyId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return result[0]?.companyId ?? null;
}

/**
 * Type guard to check if user has valid company context for multi-tenancy
 */
export function hasCompanyContext(user: any): user is TenantUser & { companyId: number } {
  return user && typeof user.companyId === 'number';
}
