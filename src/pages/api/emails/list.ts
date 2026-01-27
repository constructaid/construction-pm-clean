/**
 * Email List API Endpoint
 *
 * GET /api/emails/list
 * Returns list of synced emails for the authenticated user
 */

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { syncedEmails, connectedEmailAccounts } from '../../../lib/db/oauth-email-schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { verifyAccessToken } from '../../../lib/auth/jwt';

export const GET: APIRoute = async ({ cookies, request }) => {
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

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Find all connected accounts for this user
    const userAccounts = await db
      .select({ id: connectedEmailAccounts.id })
      .from(connectedEmailAccounts)
      .where(
        and(
          eq(connectedEmailAccounts.userId, payload.id),
          isNull(connectedEmailAccounts.deletedAt)
        )
      );

    const accountIds = userAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          emails: [],
          count: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch emails from all connected accounts
    const emails = await db
      .select({
        id: syncedEmails.id,
        subject: syncedEmails.subject,
        fromAddress: syncedEmails.fromAddress,
        fromName: syncedEmails.fromName,
        snippet: syncedEmails.snippet,
        receivedAt: syncedEmails.receivedAt,
        isRead: syncedEmails.isRead,
        isImportant: syncedEmails.isImportant,
        hasAttachments: syncedEmails.hasAttachments,
        attachmentCount: syncedEmails.attachmentCount,
        aiProcessed: syncedEmails.aiProcessed,
        aiSummary: syncedEmails.aiSummary,
        aiConfidence: syncedEmails.aiConfidence,
        aiExtractedData: syncedEmails.aiExtractedData,
        linkedProjectId: syncedEmails.linkedProjectId,
        folderName: syncedEmails.folderName,
      })
      .from(syncedEmails)
      .where(
        and(
          eq(syncedEmails.connectedAccountId, accountIds[0]), // TODO: Support multiple accounts
          isNull(syncedEmails.deletedAt)
        )
      )
      .orderBy(desc(syncedEmails.receivedAt))
      .limit(limit)
      .offset(offset);

    return new Response(
      JSON.stringify({
        success: true,
        emails,
        count: emails.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Email List API] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch emails',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
