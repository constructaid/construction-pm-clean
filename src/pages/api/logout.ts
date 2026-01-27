/**
 * Logout API Endpoint
 *
 * Clears authentication cookies and revokes session
 */

import type { APIRoute } from 'astro';
import { getSessionManager } from '../../lib/auth/session-manager';

export const POST: APIRoute = async ({ cookies }) => {
  // Get session ID from cookie
  const sessionId = cookies.get('sessionId')?.value;

  if (sessionId) {
    // Revoke session
    const sessionManager = getSessionManager();
    sessionManager.revokeSession(sessionId);
    console.log(`[AUTH] Session ${sessionId} revoked on logout`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Logged out successfully',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Clear auth cookies
        'Set-Cookie': [
          'accessToken=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0',
          'refreshToken=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0',
          'sessionId=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0',
        ].join(', '),
      },
    }
  );
};
