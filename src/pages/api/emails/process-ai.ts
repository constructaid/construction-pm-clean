/**
 * AI Email Processing API Endpoint
 *
 * POST /api/emails/process-ai
 * Triggers AI processing for unprocessed emails
 */

import type { APIRoute } from 'astro';
import { verifyAccessToken } from '../../../lib/auth/jwt';
import { processUnprocessedEmails, processEmailWithAI } from '../../../lib/services/email-ai-processor';

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
    const { emailId, limit = 50 } = body;

    let result;

    if (emailId) {
      // Process single email
      console.log(`[AI Process API] Processing single email ${emailId}`);
      const analysis = await processEmailWithAI(emailId);

      if (!analysis) {
        return new Response(
          JSON.stringify({
            error: 'Processing failed',
            message: 'Failed to process email',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      result = {
        success: true,
        message: 'Email processed successfully',
        emailId,
        analysis,
      };
    } else {
      // Process batch of unprocessed emails
      console.log(`[AI Process API] Processing batch of up to ${limit} emails`);
      const processedCount = await processUnprocessedEmails(limit);

      result = {
        success: true,
        message: `Processed ${processedCount} emails`,
        processedCount,
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[AI Process API] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
