/**
 * File Upload API Endpoint
 * POST /api/files/upload - Upload files with metadata
 * SECURED with RBAC middleware
 *
 * Note: This is a simplified version for development
 * In production, you would upload to S3/cloud storage
 */
import type { APIRoute } from 'astro';
import { db, fileAttachments } from '../../../lib/db';
import { logFileUpload } from '../../../lib/activityLogger';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { checkRBAC } from '../../../lib/middleware/rbac';

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const projectId = parseInt(formData.get('projectId') as string);
    const folderType = formData.get('folderType') as string;
    const description = formData.get('description') as string || null;
    const relatedEntity = formData.get('relatedEntity') as string || null;
    const relatedEntityId = formData.get('relatedEntityId')
      ? parseInt(formData.get('relatedEntityId') as string)
      : null;

    if (!file || !projectId || !folderType) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: file, projectId, folderType'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const { user } = rbacResult;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', projectId.toString(), folderType);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    const filePath = join(uploadsDir, fileName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Store file metadata in database
    const fileUrl = `/uploads/${projectId}/${folderType}/${fileName}`;

    const result = await db.insert(fileAttachments).values({
      projectId,
      fileName,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileUrl,
      folderType,
      description,
      relatedEntity,
      relatedEntityId,
      uploadedBy: user.id, // Use authenticated user ID
    }).returning();

    const uploadedFile = result[0];

    // Log activity using authenticated user
    await logFileUpload({
      projectId,
      fileId: uploadedFile.id,
      fileName: file.name,
      folderType,
      userId: user.id,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File uploaded successfully',
        file: uploadedFile
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('File upload error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
