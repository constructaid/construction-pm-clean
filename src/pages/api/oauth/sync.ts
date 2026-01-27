/**
 * Email Sync API Endpoint
 *
 * POST /api/oauth/sync?accountId=123
 * Triggers a manual sync for a specific account
 */

import type { APIRoute } from 'astro';
import { verifyAccessToken } from '../../../lib/auth/jwt';
import { triggerManualSync } from '../../../lib/services/email-sync-service';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get access token from cookie
    const accessToken = cookies.get('accessToken')?.value;

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the access token
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid access token',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get account ID from query params
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');

    if (!accountId) {
      return new Response(
        JSON.stringify({
          error: 'Missing parameter',
          message: 'Account ID is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Trigger manual sync
    console.log(`[Sync API] Manual sync requested for account ${accountId} by user ${payload.id}`);
    const result = await triggerManualSync(parseInt(accountId), payload.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sync completed successfully',
        result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Sync API] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Failed to sync account',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
