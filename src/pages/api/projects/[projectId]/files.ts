/**
 * Project Files API
 * GET: Retrieve files for a folder
 * POST: Upload file to a folder
 * DELETE: Delete a file
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { projectId } = params;
    const url = new URL(request.url);
    const folderId = url.searchParams.get('folderId');

    // Mock file data
    const mockFiles = [
      {
        id: 1,
        folderId: parseInt(folderId || '1'),
        projectId: parseInt(projectId!),
        fileName: 'Project Schedule.xlsx',
        fileType: 'xlsx',
        fileSize: 45632,
        filePath: '/uploads/project-schedule.xlsx',
        uploadedBy: 1,
        uploadedByName: 'John Doe',
        uploadedAt: '2025-10-20T10:30:00Z',
        version: 2,
      },
      {
        id: 2,
        folderId: parseInt(folderId || '1'),
        projectId: parseInt(projectId!),
        fileName: 'Site Plan.pdf',
        fileType: 'pdf',
        fileSize: 1250000,
        filePath: '/uploads/site-plan.pdf',
        uploadedBy: 1,
        uploadedByName: 'John Doe',
        uploadedAt: '2025-10-18T14:22:00Z',
        version: 1,
      },
      {
        id: 3,
        folderId: parseInt(folderId || '1'),
        projectId: parseInt(projectId!),
        fileName: 'Building Permit.pdf',
        fileType: 'pdf',
        fileSize: 850000,
        filePath: '/uploads/building-permit.pdf',
        uploadedBy: 2,
        uploadedByName: 'Jane Smith',
        uploadedAt: '2025-10-15T09:15:00Z',
        version: 1,
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        files: mockFiles,
        count: mockFiles.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching files:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch files',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { projectId } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No file provided',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mock file upload response
    const newFile = {
      id: Date.now(),
      folderId: parseInt(folderId),
      projectId: parseInt(projectId!),
      fileName: file.name,
      fileType: file.name.split('.').pop(),
      fileSize: file.size,
      filePath: `/uploads/${file.name}`,
      description,
      uploadedBy: 1,
      uploadedByName: 'Current User',
      uploadedAt: new Date().toISOString(),
      version: 1,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File uploaded successfully',
        file: newFile,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to upload file',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File deleted successfully',
        fileId: parseInt(fileId!),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting file:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete file',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
