/**
 * Files API Endpoint
 * GET /api/files - List files for a project
 */
import type { APIRoute } from 'astro';
import { db, fileAttachments } from '../../../lib/db';
import { eq, and, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId');
    const folderType = url.searchParams.get('folderType');
    const relatedEntity = url.searchParams.get('relatedEntity');
    const relatedEntityId = url.searchParams.get('relatedEntityId');

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let conditions = [eq(fileAttachments.projectId, parseInt(projectId))];

    if (folderType) {
      conditions.push(eq(fileAttachments.folderType, folderType as any));
    }

    if (relatedEntity) {
      conditions.push(eq(fileAttachments.relatedEntity, relatedEntity));
    }

    if (relatedEntityId) {
      conditions.push(eq(fileAttachments.relatedEntityId, parseInt(relatedEntityId)));
    }

    const result = await db.select()
      .from(fileAttachments)
      .where(and(...conditions))
      .orderBy(desc(fileAttachments.createdAt));

    return new Response(
      JSON.stringify({
        success: true,
        files: result,
        count: result.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching files:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch files',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
