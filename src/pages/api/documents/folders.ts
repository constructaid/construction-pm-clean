/**
 * Document Folders API Endpoint
 * Returns statistics for each folder type
 * GET /api/documents/folders?projectId=xxx
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db/mongodb';
import { FolderType } from '../../../lib/db/schemas/Document';
import { checkRBAC } from '../../../lib/middleware/rbac';

export const GET: APIRoute = async (context) => {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const documentsCollection = db.collection('documents');

    // Aggregate folder statistics
    const pipeline = [
      { $match: { projectId } },
      {
        $group: {
          _id: '$folderType',
          documentCount: { $sum: 1 },
          lastUpdated: { $max: '$updatedAt' }
        }
      }
    ];

    const results = await documentsCollection.aggregate(pipeline).toArray();

    // Create a map of existing folder stats
    const folderStatsMap = new Map(
      results.map(r => [r._id, { documentCount: r.documentCount, lastUpdated: r.lastUpdated }])
    );

    // Ensure all folder types are included (even with 0 documents)
    const folders = Object.values(FolderType).map(folderType => ({
      folderType,
      documentCount: folderStatsMap.get(folderType)?.documentCount || 0,
      lastUpdated: folderStatsMap.get(folderType)?.lastUpdated || null
    }));

    return new Response(
      JSON.stringify({
        success: true,
        folders
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching folder statistics:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch folder statistics'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
