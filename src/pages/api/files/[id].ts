/**
 * Single File API Endpoint
 * GET /api/files/[id]/download - Download a file
 * DELETE /api/files/[id] - Delete a file
 */
import type { APIRoute } from 'astro';
import { db, fileAttachments } from '../../../lib/db';
import { eq } from 'drizzle-orm';
import { logFileDelete } from '../../../lib/activityLogger';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'File ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileId = parseInt(id);

    // Get file info
    const files = await db.select()
      .from(fileAttachments)
      .where(eq(fileAttachments.id, fileId))
      .limit(1);

    if (files.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'File not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const file = files[0];

    // Delete from database
    await db.delete(fileAttachments).where(eq(fileAttachments.id, fileId));

    // Delete physical file
    const filePath = join(process.cwd(), 'public', file.fileUrl);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Log activity using authenticated user
    const user = locals.user;
    await logFileDelete({
      projectId: file.projectId,
      fileId: file.id,
      fileName: file.originalName,
      userId: user?.id || 1,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown User'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File deleted successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deleting file:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to delete file',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
