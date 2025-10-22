/**
 * Single Project API Endpoint
 * GET /api/projects/[id] - Fetch a single project by ID
 */
import type { APIRoute } from 'astro';
import { db, projects } from '../../../lib/db';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse ID as integer
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid project ID'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch project from database
    const result = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (result.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: result[0]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching project:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch project',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
