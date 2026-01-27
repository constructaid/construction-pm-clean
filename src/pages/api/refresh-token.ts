/**
 * Token Refresh API Endpoint
 *
 * Uses refresh token to generate new access token
 * Allows seamless session continuation without re-login
 *
 * NOTE: Audit logging temporarily disabled to avoid schema conflicts
 */

import type { APIRoute} from 'astro';
import { db } from '../../lib/db';
import { users } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyRefreshToken, generateAccessToken } from '../../lib/auth/jwt';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return new Response(
        JSON.stringify({
          error: 'Missing token',
          message: 'Refresh token is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      console.log(`[AUTH] Invalid refresh token from ${clientAddress}`);

      return new Response(
        JSON.stringify({
          error: 'Invalid token',
          message: error instanceof Error ? error.message : 'Refresh token is invalid',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user still exists and is active
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || user.deletedAt) {
      console.log(`[AUTH] Refresh token rejected - user ${payload.userId} invalid`);

      return new Response(
        JSON.stringify({
          error: 'Invalid user',
          message: 'User account is no longer valid',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    console.log(`[AUTH] Token refreshed for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        accessToken,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Update access token cookie
          'Set-Cookie': `accessToken=${accessToken}; HttpOnly; Path=/; SameSite=Strict; ${
            process.env.NODE_ENV === 'production' ? 'Secure;' : ''
          } Max-Age=${30 * 24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error('[AUTH] Token refresh error:', error);

    return new Response(
      JSON.stringify({
        error: 'Refresh failed',
        message: 'An error occurred during token refresh',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
