/**
 * Email Search API
 *
 * GET /api/emails/search?q=query&filters...
 * Full-text search across emails and attachments
 */

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { syncedEmails, emailAttachments, connectedEmailAccounts } from '../../../lib/db/oauth-email-schema';
import { indexedDocuments } from '../../../lib/db/schema';
import { eq, and, isNull, like, or, desc, sql } from 'drizzle-orm';
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

    // Get search parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category');
    const hasAttachments = url.searchParams.get('hasAttachments') === 'true';
    const isUnread = url.searchParams.get('isUnread') === 'true';
    const projectId = url.searchParams.get('projectId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!query) {
      return new Response(
        JSON.stringify({
          error: 'Missing parameter',
          message: 'Search query (q) is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
          attachments: [],
          totalResults: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build search conditions
    const searchPattern = `%${query}%`;
    const conditions = [
      isNull(syncedEmails.deletedAt),
      eq(syncedEmails.connectedAccountId, accountIds[0]), // TODO: Support multiple accounts
    ];

    if (category) {
      conditions.push(
        sql`${syncedEmails.aiExtractedData}->>'category' = ${category}`
      );
    }

    if (hasAttachments) {
      conditions.push(eq(syncedEmails.hasAttachments, true));
    }

    if (isUnread) {
      conditions.push(eq(syncedEmails.isRead, false));
    }

    if (projectId) {
      conditions.push(eq(syncedEmails.linkedProjectId, parseInt(projectId)));
    }

    if (fromDate) {
      conditions.push(sql`${syncedEmails.receivedAt} >= ${new Date(fromDate)}`);
    }

    if (toDate) {
      conditions.push(sql`${syncedEmails.receivedAt} <= ${new Date(toDate)}`);
    }

    // Search in subject, from address, and body
    conditions.push(
      or(
        like(syncedEmails.subject, searchPattern),
        like(syncedEmails.fromAddress, searchPattern),
        like(syncedEmails.fromName, searchPattern),
        like(syncedEmails.bodyText, searchPattern),
        like(syncedEmails.snippet, searchPattern),
        like(syncedEmails.aiSummary, searchPattern)
      )!
    );

    // Search emails
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
      .where(and(...conditions))
      .orderBy(desc(syncedEmails.receivedAt))
      .limit(limit);

    // Search attachments (if indexed)
    const attachmentResults = await db
      .select({
        id: emailAttachments.id,
        fileName: emailAttachments.fileName,
        fileType: emailAttachments.fileType,
        fileSize: emailAttachments.fileSize,
        storageUrl: emailAttachments.storageUrl,
        syncedEmailId: emailAttachments.syncedEmailId,
        indexedDocumentId: emailAttachments.indexedDocumentId,
      })
      .from(emailAttachments)
      .where(
        and(
          eq(emailAttachments.connectedAccountId, accountIds[0]),
          eq(emailAttachments.indexed, true),
          isNull(emailAttachments.deletedAt),
          like(emailAttachments.fileName, searchPattern)
        )
      )
      .limit(20);

    // Also search in indexed document content
    const documentResults = await db
      .select({
        id: indexedDocuments.id,
        fileName: indexedDocuments.fileName,
        fileType: indexedDocuments.fileType,
        fileSize: indexedDocuments.fileSize,
        filePath: indexedDocuments.filePath,
        extractedText: indexedDocuments.extractedText,
        keywords: indexedDocuments.keywords,
        metadata: indexedDocuments.metadata,
      })
      .from(indexedDocuments)
      .where(
        and(
          isNull(indexedDocuments.deletedAt),
          sql`${indexedDocuments.metadata}->>'source' = 'email_attachment'`,
          or(
            like(indexedDocuments.fileName, searchPattern),
            like(indexedDocuments.extractedText, searchPattern)
          )!
        )
      )
      .limit(20);

    // Combine results
    const allAttachments = [
      ...attachmentResults,
      ...documentResults.map((doc) => ({
        id: (doc.metadata as any)?.emailAttachmentId || 0,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        storageUrl: doc.filePath,
        syncedEmailId: null,
        indexedDocumentId: doc.id,
        matchedInContent: true,
      })),
    ];

    return new Response(
      JSON.stringify({
        success: true,
        query,
        emails,
        attachments: allAttachments,
        totalResults: emails.length + allAttachments.length,
        filters: {
          category,
          hasAttachments,
          isUnread,
          projectId,
          fromDate,
          toDate,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Email Search API] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
