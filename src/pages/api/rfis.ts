/**
 * RFI API Endpoint
 * POST /api/rfis - Create new RFI
 * GET /api/rfis - Get RFIs for a project
 */
import type { APIRoute } from 'astro';
import { db, rfis } from '../../lib/db';
import { eq, desc } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.projectId || !body.subject || !body.question) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: projectId, subject, question'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate RFI number (format: RFI-001, RFI-002, etc.)
    const existingRFIs = await db.select()
      .from(rfis)
      .where(eq(rfis.projectId, body.projectId))
      .orderBy(desc(rfis.id));

    const rfiCount = existingRFIs.length + 1;
    const rfiNumber = `RFI-${String(rfiCount).padStart(3, '0')}`;

    // Create new RFI
    const newRFI = {
      projectId: body.projectId,
      rfiNumber,
      subject: body.subject,
      description: body.description || '',
      question: body.question,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      submittedBy: body.submittedBy,
      assignedTo: body.assignedTo || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    };

    const result = await db.insert(rfis).values(newRFI).returning();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'RFI created successfully',
        rfi: result[0]
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating RFI:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create RFI',
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
      .from(rfis)
      .where(eq(rfis.projectId, parseInt(projectId)))
      .orderBy(desc(rfis.createdAt));

    return new Response(
      JSON.stringify({
        success: true,
        rfis: result,
        count: result.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching RFIs:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch RFIs',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
