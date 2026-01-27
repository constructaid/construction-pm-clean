/**
 * Email Thread API
 *
 * GET /api/emails/[id]/thread
 * Returns all emails in the same conversation thread
 */

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { syncedEmails, connectedEmailAccounts } from '../../../../lib/db/oauth-email-schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { verifyAccessToken } from '../../../../lib/auth/jwt';

export const GET: APIRoute = async ({ params, cookies }) => {
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

    // Get the email and verify access
    const [email] = await db
      .select({
        id: syncedEmails.id,
        subject: syncedEmails.subject,
        providerThreadId: syncedEmails.providerThreadId,
        messageId: syncedEmails.messageId,
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

    // Find all emails in the same thread
    // Match by provider thread ID or by subject (normalized)
    const normalizedSubject = normalizeSubject(email.subject || '');

    let threadEmails = [];

    if (email.providerThreadId) {
      // Use provider thread ID (more reliable)
      threadEmails = await db
        .select({
          id: syncedEmails.id,
          subject: syncedEmails.subject,
          fromAddress: syncedEmails.fromAddress,
          fromName: syncedEmails.fromName,
          toAddresses: syncedEmails.toAddresses,
          snippet: syncedEmails.snippet,
          bodyText: syncedEmails.bodyText,
          bodyHtml: syncedEmails.bodyHtml,
          receivedAt: syncedEmails.receivedAt,
          sentAt: syncedEmails.sentAt,
          isRead: syncedEmails.isRead,
          isImportant: syncedEmails.isImportant,
          hasAttachments: syncedEmails.hasAttachments,
          attachmentCount: syncedEmails.attachmentCount,
          messageId: syncedEmails.messageId,
        })
        .from(syncedEmails)
        .where(
          and(
            eq(syncedEmails.connectedAccountId, email.connectedAccountId),
            eq(syncedEmails.providerThreadId, email.providerThreadId),
            isNull(syncedEmails.deletedAt)
          )
        )
        .orderBy(syncedEmails.receivedAt);
    } else {
      // Fallback: match by subject (less reliable but works for providers without thread ID)
      const allEmails = await db
        .select({
          id: syncedEmails.id,
          subject: syncedEmails.subject,
          fromAddress: syncedEmails.fromAddress,
          fromName: syncedEmails.fromName,
          toAddresses: syncedEmails.toAddresses,
          snippet: syncedEmails.snippet,
          bodyText: syncedEmails.bodyText,
          bodyHtml: syncedEmails.bodyHtml,
          receivedAt: syncedEmails.receivedAt,
          sentAt: syncedEmails.sentAt,
          isRead: syncedEmails.isRead,
          isImportant: syncedEmails.isImportant,
          hasAttachments: syncedEmails.hasAttachments,
          attachmentCount: syncedEmails.attachmentCount,
          messageId: syncedEmails.messageId,
        })
        .from(syncedEmails)
        .where(
          and(
            eq(syncedEmails.connectedAccountId, email.connectedAccountId),
            isNull(syncedEmails.deletedAt)
          )
        )
        .orderBy(syncedEmails.receivedAt);

      // Filter by normalized subject
      threadEmails = allEmails.filter(
        (e) => normalizeSubject(e.subject || '') === normalizedSubject
      );
    }

    // Group emails by participants to show conversation flow
    const participants = new Set<string>();
    threadEmails.forEach((e) => {
      participants.add(e.fromAddress);
      if (Array.isArray(e.toAddresses)) {
        e.toAddresses.forEach((to: any) => {
          if (to.email) participants.add(to.email);
        });
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        thread: {
          id: email.providerThreadId || `subject-${normalizedSubject}`,
          subject: email.subject,
          messageCount: threadEmails.length,
          participants: Array.from(participants),
          emails: threadEmails,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Thread API] Error:', error);

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

/**
 * Normalize email subject for thread matching
 * Removes Re:, Fwd:, etc. and trims whitespace
 */
function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw):\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
