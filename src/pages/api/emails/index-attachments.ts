/**
 * Email Attachment Indexing API
 *
 * POST /api/emails/index-attachments
 * Triggers document indexing for email attachments
 */

import type { APIRoute } from 'astro';
import { verifyAccessToken } from '../../../lib/auth/jwt';
import { indexEmailAttachment, indexAllUnindexedAttachments } from '../../../lib/services/email-attachment-indexer';

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

    // Get optional parameters from request body
    const body = await request.json().catch(() => ({}));
    const { attachmentId, limit = 50 } = body;

    let result;

    if (attachmentId) {
      // Index single attachment
      console.log(`[Index API] Indexing single attachment ${attachmentId}`);
      const success = await indexEmailAttachment(attachmentId);

      result = {
        success,
        message: success ? 'Attachment indexed successfully' : 'Failed to index attachment',
        attachmentId,
      };
    } else {
      // Index batch of unindexed attachments
      console.log(`[Index API] Indexing batch of up to ${limit} attachments`);
      const stats = await indexAllUnindexedAttachments(limit);

      result = {
        success: true,
        message: `Indexed ${stats.indexed} attachments, ${stats.failed} failed`,
        ...stats,
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Index API] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Indexing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
