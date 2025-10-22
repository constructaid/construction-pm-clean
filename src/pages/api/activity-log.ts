/**
 * Activity Log API Endpoint
 * GET /api/activity-log - Get activity log for a project
 */
import type { APIRoute } from 'astro';
import { db, activityLog } from '../../lib/db';
import { eq, and, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId');
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');
    const action = url.searchParams.get('action');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build query conditions
    let conditions = [eq(activityLog.projectId, parseInt(projectId))];

    if (entityType) {
      conditions.push(eq(activityLog.entityType, entityType));
    }

    if (entityId) {
      conditions.push(eq(activityLog.entityId, parseInt(entityId)));
    }

    if (action) {
      conditions.push(eq(activityLog.action, action));
    }

    const result = await db.select()
      .from(activityLog)
      .where(and(...conditions))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    return new Response(
      JSON.stringify({
        success: true,
        activities: result,
        count: result.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching activity log:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch activity log',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
