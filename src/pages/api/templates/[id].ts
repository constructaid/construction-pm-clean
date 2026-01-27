/**
 * Single Template API Endpoint
 * GET /api/templates/[id] - Get template details
 * DELETE /api/templates/[id] - Delete template (soft delete)
 */
import type { APIRoute } from 'astro';
import { db, projectTemplates } from '../../../lib/db';
import { eq, and } from 'drizzle-orm';
import {
  apiHandler,
  requireAuth,
  validateParams,
} from '../../../lib/api/error-handler';
import { z } from 'zod';
import { excludeDeleted } from '../../../lib/db/soft-delete';

export const prerender = false;

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ========================================
// GET - Fetch single template
// ========================================

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate params
  const params = validateParams(context.params, idParamSchema);

  console.log(`GET /api/templates/${params.id}`);

  // Fetch template
  const [template] = await db
    .select()
    .from(projectTemplates)
    .where(and(
      eq(projectTemplates.id, params.id),
      excludeDeleted()
    ))
    .limit(1);

  if (!template) {
    return new Response(
      JSON.stringify({ error: 'Template not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check access: public templates or user's own templates
  const user = context.locals.user;
  if (!template.isPublic && (!user || template.createdBy !== user.id)) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return {
    template,
  };
});

// ========================================
// DELETE - Delete template (soft delete)
// ========================================

export const DELETE: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  const user = context.locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate params
  const params = validateParams(context.params, idParamSchema);

  console.log(`DELETE /api/templates/${params.id} by user:`, user.id);

  // Fetch template to check ownership
  const [template] = await db
    .select()
    .from(projectTemplates)
    .where(and(
      eq(projectTemplates.id, params.id),
      excludeDeleted()
    ))
    .limit(1);

  if (!template) {
    return new Response(
      JSON.stringify({ error: 'Template not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check ownership (only creator or admin can delete)
  if (template.createdBy !== user.id && user.role !== 'ADMIN') {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Soft delete
  await db
    .update(projectTemplates)
    .set({ deletedAt: new Date() })
    .where(eq(projectTemplates.id, params.id));

  console.log('Template deleted successfully:', params.id);

  return {
    message: 'Template deleted successfully',
  };
});
