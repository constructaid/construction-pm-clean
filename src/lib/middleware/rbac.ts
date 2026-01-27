/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces permissions based on user roles and project membership
 *
 * User Roles: OWNER, ARCHITECT, GC, SUB, ADMIN
 * Team Roles: owner, architect, engineer, general_contractor, subcontractor, supplier, inspector, consultant
 */

import type { APIContext } from 'astro';
import { db } from '../db';
import { users, projectTeamMembers, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAccessToken, extractBearerToken } from '../auth/jwt';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'OWNER' | 'ARCHITECT' | 'GC' | 'SUB' | 'ADMIN';
  companyId: number | null;
}

export interface ProjectPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageTeam: boolean;
  canManageFinancials: boolean;
  canApprove: boolean;
}

/**
 * Extract user from JWT token in Authorization header
 * Returns null if no valid token found
 */
export async function authenticateUser(request: Request): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return null;
    }

    const token = extractBearerToken(authHeader);
    if (!token) {
      return null;
    }

    // Verify JWT token
    const payload = verifyAccessToken(token);

    // Fetch fresh user data from database to ensure current role/status
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role as any,
      companyId: user.companyId,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific project
 * Returns team member record if they have access, null otherwise
 *
 * Multi-tenancy: Also verifies that the project belongs to the user's company
 */
export async function checkProjectAccess(userId: number, projectId: number, userCompanyId?: number | null) {
  try {
    // First check if user is a team member
    const [teamMember] = await db
      .select()
      .from(projectTeamMembers)
      .where(
        and(
          eq(projectTeamMembers.userId, userId),
          eq(projectTeamMembers.projectId, projectId),
          eq(projectTeamMembers.isActive, true)
        )
      )
      .limit(1);

    if (teamMember) {
      return teamMember;
    }

    // Fallback: Check if user is the project owner or creator, or same company
    const [project] = await db
      .select({
        ownerId: projects.ownerId,
        createdBy: projects.createdBy,
        companyId: projects.companyId,
        generalContractorId: projects.generalContractorId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return null;
    }

    // Check direct ownership
    if (project.ownerId === userId || project.createdBy === userId || project.generalContractorId === userId) {
      // Return a virtual team member with owner role
      return {
        id: 0,
        userId,
        projectId,
        teamRole: 'owner' as const,
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // MULTI-TENANCY: Check if user belongs to the same company as the project
    // This allows company members to access all projects within their company
    if (userCompanyId && project.companyId === userCompanyId) {
      return {
        id: 0,
        userId,
        projectId,
        teamRole: 'general_contractor' as const, // Company member gets GC-level access
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error('Project access check error:', error);
    return null;
  }
}

/**
 * Get user permissions for a specific project based on their role
 */
export function getProjectPermissions(
  userRole: 'OWNER' | 'ARCHITECT' | 'GC' | 'SUB' | 'ADMIN',
  teamRole: string | null
): ProjectPermissions {
  // ADMIN has full permissions
  if (userRole === 'ADMIN') {
    return {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canManageTeam: true,
      canManageFinancials: true,
      canApprove: true,
    };
  }

  // OWNER (project owner) has full permissions on their projects
  if (userRole === 'OWNER' || teamRole === 'owner') {
    return {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canManageTeam: true,
      canManageFinancials: true,
      canApprove: true,
    };
  }

  // GC (General Contractor) has extensive permissions
  if (userRole === 'GC' || teamRole === 'general_contractor') {
    return {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canManageTeam: true,
      canManageFinancials: true,
      canApprove: true,
    };
  }

  // ARCHITECT has read/write but limited delete/financial access
  if (userRole === 'ARCHITECT' || teamRole === 'architect' || teamRole === 'engineer') {
    return {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canManageTeam: false,
      canManageFinancials: false,
      canApprove: true,
    };
  }

  // SUB (Subcontractor) has read and limited write access
  if (userRole === 'SUB' || teamRole === 'subcontractor') {
    return {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canManageTeam: false,
      canManageFinancials: false,
      canApprove: false,
    };
  }

  // Other team roles (supplier, inspector, consultant) have read-only by default
  return {
    canRead: true,
    canWrite: false,
    canDelete: false,
    canManageTeam: false,
    canManageFinancials: false,
    canApprove: false,
  };
}

/**
 * Middleware to require authentication
 * Returns 401 if not authenticated
 * Now uses context.locals.user populated by global middleware
 */
export async function requireAuth(context: APIContext): Promise<AuthUser | Response> {
  // First check if user is in context.locals (populated by middleware)
  if (context.locals.user) {
    // Fetch full user data from database
    const [user] = await db.select().from(users).where(eq(users.id, context.locals.user.id)).limit(1);

    if (user && user.status === 'ACTIVE') {
      return {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role as any,
        companyId: user.companyId, // Multi-tenancy: user's company ID
      };
    }
  }

  // Fallback to Authorization header for API clients
  const user = await authenticateUser(context.request);
  if (user) {
    return user;
  }

  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message: 'Authentication required'
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Middleware to require project access
 * Returns 403 if user doesn't have access to the project
 *
 * Multi-tenancy: Passes user's companyId to checkProjectAccess for company-level access
 */
export async function requireProjectAccess(
  context: APIContext,
  user: AuthUser,
  projectId: number
): Promise<{ user: AuthUser; teamMember: any; permissions: ProjectPermissions } | Response> {
  // Admin bypasses project membership check
  if (user.role === 'ADMIN') {
    const permissions = getProjectPermissions(user.role, null);
    return { user, teamMember: null, permissions };
  }

  // Pass user's companyId for multi-tenancy checks
  const teamMember = await checkProjectAccess(user.id, projectId, user.companyId);

  if (!teamMember) {
    return new Response(JSON.stringify({
      error: 'Forbidden',
      message: 'You do not have access to this project'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const permissions = getProjectPermissions(user.role, teamMember.teamRole);

  return { user, teamMember, permissions };
}

/**
 * Middleware to require specific permission
 * Returns 403 if user doesn't have the required permission
 */
export function requirePermission(
  permissions: ProjectPermissions,
  requiredPermission: keyof ProjectPermissions
): Response | null {
  if (!permissions[requiredPermission]) {
    return new Response(JSON.stringify({
      error: 'Forbidden',
      message: `You do not have permission to perform this action (${requiredPermission} required)`
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return null;
}

/**
 * Helper function to check if user owns a specific resource
 * Used for operations like editing/deleting comments
 */
export function isResourceOwner(userId: number, resourceCreatorId: number): boolean {
  return userId === resourceCreatorId;
}

/**
 * Complete RBAC check combining authentication, project access, and permission
 * Returns error response or user context with permissions
 */
export async function checkRBAC(
  context: APIContext,
  projectId: number,
  requiredPermission?: keyof ProjectPermissions
): Promise<
  | Response
  | { user: AuthUser; teamMember: any; permissions: ProjectPermissions }
> {
  // Step 1: Authenticate user
  const authResult = await requireAuth(context);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;

  // Step 2: Check project access
  const accessResult = await requireProjectAccess(context, user, projectId);
  if (accessResult instanceof Response) {
    return accessResult;
  }

  // Step 3: Check specific permission if required
  if (requiredPermission) {
    const permissionError = requirePermission(accessResult.permissions, requiredPermission);
    if (permissionError) {
      return permissionError;
    }
  }

  return accessResult;
}
