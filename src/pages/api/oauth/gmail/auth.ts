/**
 * Gmail OAuth Authorization Endpoint
 *
 * Initiates the OAuth flow by redirecting the user to Google's login page
 */

import type { APIRoute } from 'astro';
import { getGmailAuthUrl } from '../../../../lib/services/gmail-oauth';
import { verifyAccessToken } from '../../../../lib/auth/jwt';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    // Get access token from cookie
    const accessToken = cookies.get('accessToken')?.value;

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in to connect an email account',
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

    // Generate a state parameter that includes the user ID
    // This will be verified in the callback to prevent CSRF
    const state = Buffer.from(
      JSON.stringify({
        userId: payload.id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Get the Gmail authorization URL
    const authUrl = getGmailAuthUrl(state);

    // Redirect the user to Google's login page
    return redirect(authUrl, 302);
  } catch (error) {
    console.error('[Gmail OAuth] Auth error:', error);

    return new Response(
      JSON.stringify({
        error: 'OAuth failed',
        message: 'Failed to initiate Gmail OAuth flow',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
