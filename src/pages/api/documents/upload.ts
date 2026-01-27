/**
 * Document Upload API Endpoint
 * Handles file uploads for project documents
 * POST /api/documents/upload
 * SECURED with RBAC middleware
 *
 * Note: This is a simplified version for local development.
 * In production, integrate with AWS S3 or similar cloud storage.
 */
import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db/mongodb';
import { FolderType, DocumentStatus } from '../../../lib/db/schemas/Document';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { checkRBAC } from '../../../lib/middleware/rbac';

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    // Parse multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      uploadDir: './uploads',
      keepExtensions: true,
      multiples: true
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(request, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    // Extract form data
    const projectId = Array.isArray(fields.projectId) ? fields.projectId[0] : fields.projectId;
    const folderType = Array.isArray(fields.folderType) ? fields.folderType[0] : fields.folderType;
    const csiDivision = Array.isArray(fields.csiDivision) ? fields.csiDivision[0] : fields.csiDivision;

    if (!projectId || !folderType) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID and folder type are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const { user } = rbacResult;

    // Validate folder type
    if (!Object.values(FolderType).includes(folderType as FolderType)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid folder type'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get uploaded file
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const file = fileArray[0];

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No file uploaded'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', projectId);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalFilename || 'document';
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const newFileName = `${baseName}-${timestamp}${ext}`;
    const newFilePath = path.join(uploadsDir, newFileName);

    // Move file to permanent location
    await fs.rename(file.filepath, newFilePath);

    // Generate file URL (relative to public directory)
    const fileUrl = `/uploads/${projectId}/${newFileName}`;

    // Get file stats
    const stats = await fs.stat(newFilePath);

    // Connect to database
    const { db } = await connectToDatabase();
    const documentsCollection = db.collection('documents');

    // Create document record
    const document = {
      projectId,
      fileName: originalName,
      fileUrl,
      fileSize: stats.size,
      fileType: file.mimetype || 'application/octet-stream',
      folderType: folderType as FolderType,
      csiDivision: csiDivision || null,
      status: DocumentStatus.DRAFT,
      version: 1,
      hasMarkups: false,
      tags: [],
      uploadedBy: user.id.toString(), // Use authenticated user ID
      visibleToRoles: ['GC', 'OWNER', 'ARCHITECT'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert document into database
    const result = await documentsCollection.insertOne(document);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File uploaded successfully',
        documentId: result.insertedId.toString(),
        fileName: originalName,
        fileUrl,
        fileSize: stats.size,
        fileType: document.fileType
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'File upload failed. Please try again.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
