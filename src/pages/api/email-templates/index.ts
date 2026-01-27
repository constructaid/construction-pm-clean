/**
 * Email Templates API
 *
 * GET /api/email-templates - List all templates
 * POST /api/email-templates - Create new template
 */

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { emailTemplates } from '../../../lib/db/email-templates-schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { verifyAccessToken } from '../../../lib/auth/jwt';

/**
 * GET - List email templates
 */
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
    const category = url.searchParams.get('category');

    // Fetch templates (user's own + shared + public)
    let conditions = [
      isNull(emailTemplates.deletedAt),
      or(
        eq(emailTemplates.userId, payload.id),
        eq(emailTemplates.isShared, true),
        eq(emailTemplates.isPublic, true)
      )!,
    ];

    if (category) {
      conditions.push(eq(emailTemplates.category, category));
    }

    const templates = await db
      .select()
      .from(emailTemplates)
      .where(and(...conditions))
      .orderBy(emailTemplates.name);

    return new Response(
      JSON.stringify({
        success: true,
        templates,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Email Templates API] GET error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch templates',
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
 * POST - Create new email template
 */
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

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      category,
      subject,
      body: templateBody,
      variables = [],
      isShared = false,
      isPublic = false,
      tags = [],
    } = body;

    // Validate required fields
    if (!name || !subject || !templateBody) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          message: 'Name, subject, and body are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create template
    const [template] = await db
      .insert(emailTemplates)
      .values({
        userId: payload.id,
        name,
        description,
        category,
        subject,
        body: templateBody,
        variables,
        isShared,
        isPublic,
        tags,
      })
      .returning();

    console.log(`[Email Templates API] Created template ${template.id} by user ${payload.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Template created successfully',
        template,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Email Templates API] POST error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
