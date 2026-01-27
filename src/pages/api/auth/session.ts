/**
 * Session Management API Endpoint
 * GET /api/auth/session - Get current session status
 * DELETE /api/auth/session - Logout and revoke current session
 *
 * SECURITY:
 * - Requires valid authentication
 * - Updates session activity on each request
 * - Returns session expiry information
 */
import type { APIRoute } from 'astro';
import { apiHandler, requireAuth } from '../../../lib/api/error-handler';
import { getSessionManager } from '../../../lib/auth/session-manager';
import { getTokenInfo } from '../../../lib/auth/jwt';

export const prerender = false;

/**
 * GET - Get current session status
 */
export const GET: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);
  const user = context.locals.user!;

  const sessionManager = getSessionManager();

  // Get session ID from cookie or header
  const sessionId = context.cookies.get('sessionId')?.value;

  if (!sessionId) {
    return {
      success: false,
      message: 'No active session',
    };
  }

  // Get session
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return {
      success: false,
      message: 'Session not found or expired',
    };
  }

  // Update activity
  sessionManager.updateActivity(sessionId);

  // Get expiry info
  const expiryInfo = sessionManager.getSessionExpiryInfo(sessionId);

  // Get token info
  const accessToken = context.cookies.get('accessToken')?.value;
  const tokenInfo = accessToken ? getTokenInfo(accessToken) : null;

  return {
    success: true,
    session: {
      id: session.id,
      userId: session.userId,
      email: session.email,
      role: session.role,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
    },
    expiry: expiryInfo
      ? {
          inactivityExpiresIn: Math.floor(expiryInfo.inactivityExpiresIn / 1000), // seconds
          maxLifetimeExpiresIn: Math.floor(expiryInfo.maxLifetimeExpiresIn / 1000), // seconds
          expiresIn: Math.floor(expiryInfo.expiresIn / 1000), // seconds
        }
      : null,
    tokenInfo: tokenInfo
      ? {
          expiresAt: tokenInfo.expiresAt,
          expiresIn: tokenInfo.expiresIn,
          isExpired: tokenInfo.isExpired,
        }
      : null,
  };
});

/**
 * DELETE - Logout and revoke session
 */
export const DELETE: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  const sessionManager = getSessionManager();

  // Get session ID from cookie
  const sessionId = context.cookies.get('sessionId')?.value;

  if (sessionId) {
    // Revoke session
    sessionManager.revokeSession(sessionId);
  }

  // Clear cookies
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Logged out successfully',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': [
          'accessToken=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0',
          'refreshToken=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0',
          'sessionId=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0',
        ].join(', '),
      },
    }
  );
});
