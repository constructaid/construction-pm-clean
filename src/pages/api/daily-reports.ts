/**
 * Daily Reports API Endpoint
 * POST /api/daily-reports - Create new Daily Report
 * GET /api/daily-reports - Get Daily Reports for a project
 */
import type { APIRoute } from 'astro';
import { db, dailyReports } from '../../lib/db';
import { eq, desc } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.projectId || !body.reportDate || !body.workPerformed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: projectId, reportDate, workPerformed'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new Daily Report
    const newReport = {
      projectId: body.projectId,
      reportDate: new Date(body.reportDate),
      weatherCondition: body.weatherCondition || null,
      temperature: body.temperature || null,
      totalWorkers: body.totalWorkers || 0,
      workPerformed: body.workPerformed,
      issues: body.issues || null,
      safetyNotes: body.safetyNotes || null,
      submittedBy: body.submittedBy,
    };

    const result = await db.insert(dailyReports).values(newReport).returning();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily Report created successfully',
        report: result[0]
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Daily Report:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create Daily Report',
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
      .from(dailyReports)
      .where(eq(dailyReports.projectId, parseInt(projectId)))
      .orderBy(desc(dailyReports.reportDate));

    return new Response(
      JSON.stringify({
        success: true,
        reports: result,
        count: result.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Daily Reports:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch Daily Reports',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
