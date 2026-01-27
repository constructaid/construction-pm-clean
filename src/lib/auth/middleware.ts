/**
 * Authentication Middleware Utilities
 *
 * Helper functions to verify authentication in API routes
 * Works with both JWT tokens and mock auth (in development)
 */

import type { APIContext } from 'astro';
import { verifyAccessToken, extractBearerToken } from './jwt';
import { isAuthBypassed, getMockUserByEmail } from './mockAuth';

export interface AuthUser {
  userId: number;
  email: string;
  role: string;
  companyId: number | null;
}

/**
 * Extract and verify authentication from request
 * Supports both JWT tokens and mock auth bypass
 *
 * @returns AuthUser if authenticated, null otherwise
 */
export async function getAuthUser(context: APIContext): Promise<AuthUser | null> {
  // Check if auth is bypassed (development mode)
  if (isAuthBypassed()) {
    // Try to get mock user from request headers or cookies
    const mockEmail = context.request.headers.get('x-mock-user-email') || context.cookies.get('mockUserEmail')?.value;

    if (mockEmail) {
      const mockUser = getMockUserByEmail(mockEmail);
      if (mockUser) {
        return {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          companyId: mockUser.companyId,
        };
      }
    }

    // Default to GC user in bypass mode if no specific user requested
    return {
      userId: 1,
      email: 'admin@gccompany.com',
      role: 'gc_admin',
      companyId: 1,
    };
  }

  // Normal JWT authentication
  // Try Authorization header first
  const authHeader = context.request.headers.get('authorization');
  let token = extractBearerToken(authHeader);

  // Fall back to cookie
  if (!token) {
    token = context.cookies.get('accessToken')?.value || null;
  }

  if (!token) {
    return null;
  }

  // Verify token
  try {
    const payload = verifyAccessToken(token);
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Require authentication in an API route
 * Returns 401 if not authenticated
 *
 * Usage:
 * const user = await requireAuth(context);
 * if (user instanceof Response) return user; // 401 error
 * // user is AuthUser, continue with authenticated logic
 */
export async function requireAuth(context: APIContext): Promise<AuthUser | Response> {
  const user = await getAuthUser(context);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return user;
}

/**
 * Require specific role(s) for an API route
 * Returns 401 if not authenticated, 403 if wrong role
 *
 * Usage:
 * const user = await requireRole(context, ['gc_admin', 'owner_admin']);
 * if (user instanceof Response) return user; // 401 or 403 error
 * // user is AuthUser with correct role
 */
export async function requireRole(
  context: APIContext,
  allowedRoles: string[]
): Promise<AuthUser | Response> {
  const user = await getAuthUser(context);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return user;
}

/**
 * Check if user has specific permission
 * Uses the permission matrix from schema
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  // Define permission matrix based on roles
  // This should ideally come from database but defining here for performance
  const permissionMatrix: Record<string, string[]> = {
    // GC Admins - full access
    gc_admin: ['*'],
    gc_pm: [
      'projects.view',
      'projects.edit',
      'rfis.manage',
      'submittals.manage',
      'change_orders.manage',
      'drawings.view',
      'drawings.upload',
      'schedule.view',
      'schedule.edit',
      'budget.view',
      'tasks.manage',
      'documents.manage',
    ],
    gc_super: [
      'projects.view',
      'rfis.view',
      'submittals.view',
      'change_orders.view',
      'drawings.view',
      'schedule.view',
      'tasks.manage',
      'documents.view',
      'photos.upload',
      'daily_logs.create',
    ],

    // Owner roles
    owner_admin: [
      'projects.view',
      'projects.edit',
      'rfis.view',
      'rfis.respond',
      'submittals.view',
      'submittals.approve',
      'change_orders.view',
      'change_orders.approve',
      'drawings.view',
      'schedule.view',
      'budget.view',
      'documents.view',
    ],
    owner_rep: [
      'projects.view',
      'rfis.view',
      'submittals.view',
      'change_orders.view',
      'drawings.view',
      'schedule.view',
      'documents.view',
    ],

    // Architect roles
    architect_admin: [
      'projects.view',
      'rfis.view',
      'rfis.respond',
      'submittals.view',
      'submittals.review',
      'drawings.view',
      'drawings.upload',
      'drawings.revise',
      'schedule.view',
      'documents.view',
      'documents.upload',
    ],
    architect_designer: [
      'projects.view',
      'rfis.view',
      'drawings.view',
      'drawings.upload',
      'schedule.view',
      'documents.view',
    ],

    // Subcontractor roles
    sub_admin: [
      'projects.view',
      'rfis.create',
      'rfis.view',
      'submittals.create',
      'submittals.view',
      'change_orders.view',
      'drawings.view',
      'schedule.view',
      'tasks.view',
      'documents.view',
      'documents.upload',
    ],
    sub_pm: [
      'projects.view',
      'rfis.view',
      'submittals.view',
      'drawings.view',
      'schedule.view',
      'tasks.view',
      'documents.view',
    ],
    sub_foreman: [
      'projects.view',
      'rfis.view',
      'drawings.view',
      'schedule.view',
      'tasks.view',
      'daily_logs.create',
      'photos.upload',
    ],
  };

  const userPermissions = permissionMatrix[user.role] || [];

  // Check for wildcard permission
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check for exact permission
  return userPermissions.includes(permission);
}

/**
 * Require specific permission for an API route
 */
export async function requirePermission(
  context: APIContext,
  permission: string
): Promise<AuthUser | Response> {
  const user = await getAuthUser(context);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!hasPermission(user, permission)) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: `Permission required: ${permission}`,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return user;
}
