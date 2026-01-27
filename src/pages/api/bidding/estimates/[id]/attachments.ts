/**
 * Estimate Attachments API
 * Upload, list, and delete attachments for cost estimates
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/db';
import { fileAttachments, costEstimates } from '../../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { checkRBAC } from '../../../../../lib/middleware/rbac';

// Helper to get projectId from estimate
async function getProjectIdFromEstimate(estimateId: number): Promise<number | null> {
  const [est] = await db
    .select({ projectId: costEstimates.projectId })
    .from(costEstimates)
    .where(eq(costEstimates.id, estimateId));
  return est?.projectId || null;
}

// GET - List all attachments for an estimate
export const GET: APIRoute = async (context) => {
  try {
    const { params } = context;
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get projectId from estimate for RBAC check
    const projectId = await getProjectIdFromEstimate(parseInt(id));
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, projectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
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
export const POST: APIRoute = async (context) => {
  try {
    const { request, params } = context;
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get projectId from estimate for RBAC check
    const projectId = await getProjectIdFromEstimate(parseInt(id));
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const { user } = rbacResult;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
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

    // Save to database - use authenticated user ID
    const fileUrl = `/uploads/estimates/${id}/${fileName}`;
    const [attachment] = await db
      .insert(fileAttachments)
      .values({
        projectId: projectId,
        fileName: fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        fileUrl: fileUrl,
        folderType: 'estimates',
        relatedEntity: 'cost_estimate',
        relatedEntityId: parseInt(id),
        description: description || null,
        uploadedBy: user.id, // Use authenticated user ID
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
export const DELETE: APIRoute = async (context) => {
  try {
    const { request, params } = context;
    const { id } = params;
    const { attachmentId } = await request.json();

    if (!id || !attachmentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID and Attachment ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get projectId from estimate for RBAC check
    const projectId = await getProjectIdFromEstimate(parseInt(id));
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project delete access
    const rbacResult = await checkRBAC(context, projectId, 'canDelete');
    if (rbacResult instanceof Response) {
      return rbacResult;
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
