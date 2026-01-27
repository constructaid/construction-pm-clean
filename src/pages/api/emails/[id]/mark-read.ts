/**
 * Mark Email as Read/Unread API
 *
 * POST /api/emails/[id]/mark-read
 * Marks an email as read or unread
 */

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { syncedEmails, connectedEmailAccounts } from '../../../../lib/db/oauth-email-schema';
import { eq, and } from 'drizzle-orm';
import { verifyAccessToken } from '../../../../lib/auth/jwt';

export const POST: APIRoute = async ({ params, request, cookies }) => {
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

    const emailId = parseInt(params.id || '0');
    if (!emailId) {
      return new Response(
        JSON.stringify({
          error: 'Invalid parameter',
          message: 'Valid email ID is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get isRead from request body
    const body = await request.json().catch(() => ({ isRead: true }));
    const isRead = body.isRead !== false; // Default to true

    // Verify email belongs to user's connected accounts
    const [email] = await db
      .select({
        id: syncedEmails.id,
        connectedAccountId: syncedEmails.connectedAccountId,
      })
      .from(syncedEmails)
      .where(eq(syncedEmails.id, emailId))
      .limit(1);

    if (!email) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Email not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify account belongs to user
    const [account] = await db
      .select()
      .from(connectedEmailAccounts)
      .where(
        and(
          eq(connectedEmailAccounts.id, email.connectedAccountId),
          eq(connectedEmailAccounts.userId, payload.id)
        )
      )
      .limit(1);

    if (!account) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You do not have access to this email',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update email read status
    await db
      .update(syncedEmails)
      .set({
        isRead,
        updatedAt: new Date(),
      })
      .where(eq(syncedEmails.id, emailId));

    console.log(`[Mark Read API] Email ${emailId} marked as ${isRead ? 'read' : 'unread'}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email marked as ${isRead ? 'read' : 'unread'}`,
        emailId,
        isRead,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Mark Read API] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
