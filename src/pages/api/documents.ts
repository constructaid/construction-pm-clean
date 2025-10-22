/**
 * Documents API Endpoint
 * Handles CRUD operations for project documents
 * GET /api/documents - Fetch documents
 * GET /api/documents/folders - Get folder statistics
 */
import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../lib/db/mongodb';
import { FolderType } from '../../lib/db/schemas/Document';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const folderType = url.searchParams.get('folderType');
    const csiDivision = url.searchParams.get('csiDivision');

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const documentsCollection = db.collection('documents');

    // Build query
    const query: any = { projectId };

    if (folderType) {
      query.folderType = folderType;
    }

    if (csiDivision) {
      query.csiDivision = csiDivision;
    }

    // Fetch documents
    const documents = await documentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(
      JSON.stringify({
        success: true,
        documents,
        count: documents.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching documents:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch documents'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
