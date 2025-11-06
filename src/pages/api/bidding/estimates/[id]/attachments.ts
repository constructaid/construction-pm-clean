/**
 * Estimate Attachments API
 * Upload, list, and delete attachments for cost estimates
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/db';
import { fileAttachments } from '../../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// GET - List all attachments for an estimate
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const attachments = await db
      .select()
      .from(fileAttachments)
      .where(
        and(
          eq(fileAttachments.relatedEntity, 'cost_estimate'),
          eq(fileAttachments.relatedEntityId, parseInt(id))
        )
      )
      .orderBy(fileAttachments.createdAt);

    return new Response(JSON.stringify({ success: true, attachments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch attachments' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Upload a new attachment
export const POST: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId');
    const description = formData.get('description') as string;
    const userId = formData.get('userId');

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!projectId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project ID and User ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'estimates', id);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Save to database
    const fileUrl = `/uploads/estimates/${id}/${fileName}`;
    const [attachment] = await db
      .insert(fileAttachments)
      .values({
        projectId: parseInt(projectId as string),
        fileName: fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        fileUrl: fileUrl,
        folderType: 'estimates',
        relatedEntity: 'cost_estimate',
        relatedEntityId: parseInt(id),
        description: description || null,
        uploadedBy: parseInt(userId as string),
        tags: [],
      })
      .returning();

    return new Response(
      JSON.stringify({ success: true, attachment }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to upload attachment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete an attachment
export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;
    const { attachmentId } = await request.json();

    if (!id || !attachmentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID and Attachment ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get attachment info
    const [attachment] = await db
      .select()
      .from(fileAttachments)
      .where(eq(fileAttachments.id, attachmentId));

    if (!attachment) {
      return new Response(
        JSON.stringify({ success: false, error: 'Attachment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete from database
    await db.delete(fileAttachments).where(eq(fileAttachments.id, attachmentId));

    // Note: We're not deleting the physical file for now (for audit trail)
    // You could add physical file deletion here if needed

    return new Response(
      JSON.stringify({ success: true, message: 'Attachment deleted' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete attachment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
