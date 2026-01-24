/**
 * Email Sync Cron Job Endpoint
 *
 * This endpoint should be called by a cron job service (e.g., Vercel Cron, AWS EventBridge, etc.)
 * to trigger automatic email syncing for all active accounts
 *
 * Usage with Vercel Cron:
 *   Add to vercel.json: { "crons": [{ "path": "/api/cron/sync-emails", "schedule": "0/15 * * * *" }] }
 *
 * Usage with external cron:
 *   Set up a cron job to call: curl -X POST https://your-domain.com/api/cron/sync-emails
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import type { APIRoute } from 'astro';
import { syncAllAccounts } from '../../../lib/services/email-sync-service';

// Secret for authenticating cron requests
const CRON_SECRET = process.env.CRON_SECRET || '';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify the cron secret (prevents unauthorized access)
    const authHeader = request.headers.get('Authorization');

    if (CRON_SECRET) {
      if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
        console.error('[Email Sync Cron] Unauthorized request');
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid or missing authorization header',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      console.warn('[Email Sync Cron] CRON_SECRET not configured - cron endpoint is unprotected');
    }

    console.log('[Email Sync Cron] Starting automatic email sync');
    const startTime = Date.now();

    // Sync all active accounts
    await syncAllAccounts();

    const duration = Date.now() - startTime;
    console.log(`[Email Sync Cron] Completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sync completed',
        duration: `${duration}ms`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Email Sync Cron] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Also support GET for simple health checks
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      service: 'Email Sync Cron',
      status: 'active',
      endpoint: 'POST /api/cron/sync-emails',
      authentication: CRON_SECRET ? 'required' : 'not configured',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
