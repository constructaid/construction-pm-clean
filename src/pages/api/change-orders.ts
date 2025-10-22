/**
 * Change Order API Endpoint
 * POST /api/change-orders - Create new Change Order
 * GET /api/change-orders - Get Change Orders for a project
 */
import type { APIRoute } from 'astro';
import { db, changeOrders } from '../../lib/db';
import { eq, desc } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.projectId || !body.title || !body.description || !body.reason) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: projectId, title, description, reason'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate Change Order number (format: CO-001, CO-002, etc.)
    const existingCOs = await db.select()
      .from(changeOrders)
      .where(eq(changeOrders.projectId, body.projectId))
      .orderBy(desc(changeOrders.id));

    const coCount = existingCOs.length + 1;
    const changeOrderNumber = `CO-${String(coCount).padStart(3, '0')}`;

    // Create new Change Order
    const newCO = {
      projectId: body.projectId,
      changeOrderNumber,
      title: body.title,
      description: body.description,
      reason: body.reason,
      costImpact: body.costImpact || 0,
      scheduleImpactDays: body.scheduleImpactDays || 0,
      initiatedBy: body.initiatedBy,
    };

    const result = await db.insert(changeOrders).values(newCO).returning();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Change Order created successfully',
        changeOrder: result[0]
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Change Order:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create Change Order',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
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

    const result = await db.select()
      .from(changeOrders)
      .where(eq(changeOrders.projectId, parseInt(projectId)))
      .orderBy(desc(changeOrders.createdAt));

    return new Response(
      JSON.stringify({
        success: true,
        changeOrders: result,
        count: result.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Change Orders:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch Change Orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
