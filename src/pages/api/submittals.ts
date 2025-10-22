/**
 * Submittals API Endpoint
 * POST /api/submittals - Create new Submittal
 * GET /api/submittals - Get Submittals for a project
 */
import type { APIRoute } from 'astro';
import { db, submittals } from '../../lib/db';
import { eq, desc } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.projectId || !body.csiDivision || !body.title) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: projectId, csiDivision, title'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate Submittal number (format: SUB-001, SUB-002, etc.)
    const existingSubs = await db.select()
      .from(submittals)
      .where(eq(submittals.projectId, body.projectId))
      .orderBy(desc(submittals.id));

    const subCount = existingSubs.length + 1;
    const submittalNumber = `SUB-${String(subCount).padStart(3, '0')}`;

    // Create new Submittal
    const newSubmittal = {
      projectId: body.projectId,
      submittalNumber,
      csiDivision: body.csiDivision,
      specSection: body.specSection || null,
      title: body.title,
      description: body.description || null,
      submittedBy: body.submittedBy,
      submittedDate: body.submittedDate ? new Date(body.submittedDate) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    };

    const result = await db.insert(submittals).values(newSubmittal).returning();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Submittal created successfully',
        submittal: result[0]
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Submittal:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create Submittal',
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
      .from(submittals)
      .where(eq(submittals.projectId, parseInt(projectId)))
      .orderBy(desc(submittals.createdAt));

    return new Response(
      JSON.stringify({
        success: true,
        submittals: result,
        count: result.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Submittals:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch Submittals',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
