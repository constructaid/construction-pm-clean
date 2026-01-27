/**
 * Project Archive API Endpoint
 * Archive/unarchive a project
 * PATCH /api/projects/[id]/archive - Toggle archive status
 */
import type { APIRoute } from 'astro';
import { db, projects } from '../../../../lib/db';
import { eq, and } from 'drizzle-orm';
import {
  apiHandler,
  validateParams,
  validateBody,
} from '../../../../lib/api/error-handler';
import { z } from 'zod';
import { checkRBAC } from '../../../../lib/middleware/rbac';
import { excludeDeleted } from '../../../../lib/db/soft-delete';

export const prerender = false;

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const archiveBodySchema = z.object({
  isArchived: z.boolean(),
});

export const PATCH: APIRoute = apiHandler(async (context) => {
  // Validate URL parameters
  const params = validateParams(context.params, idParamSchema);

  // RBAC Check - user must have canWrite permission
  const rbacResult = await checkRBAC(context, params.id, 'canWrite');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  // Validate request body
  const body = await validateBody(context, archiveBodySchema);

  console.log(`PATCH /api/projects/${params.id}/archive - isArchived:`, body.isArchived);

  // Update the project's archive status
  const [updatedProject] = await db
    .update(projects)
    .set({
      isArchived: body.isArchived,
      updatedAt: new Date(),
    })
    .where(and(
      eq(projects.id, params.id),
      excludeDeleted()
    ))
    .returning();

  if (!updatedProject) {
    return new Response(
      JSON.stringify({ error: 'Project not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return {
    message: body.isArchived ? 'Project archived successfully' : 'Project unarchived successfully',
    project: updatedProject,
  };
});
