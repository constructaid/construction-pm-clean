/**
 * Projects API Endpoint - PostgreSQL Version
 * Handles CRUD operations for projects
 * GET /api/projects - Fetch projects for a user
 * POST /api/projects - Create new project
 */
import type { APIRoute } from 'astro';
import { db, projects } from '../../lib/db';
import { eq, or, and, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');

    console.log('GET /api/projects - userId:', userId, 'status:', status);
    console.log('Full URL:', request.url);

    // Build query
    let query = db.select().from(projects);

    // Filter by user (owner or GC) if userId provided
    if (userId) {
      const userIdNum = parseInt(userId);
      query = query.where(
        or(
          eq(projects.ownerId, userIdNum),
          eq(projects.generalContractorId, userIdNum)
        )
      ) as typeof query;
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      query = query.where(eq(projects.status, status as any)) as typeof query;
    }

    // Execute query
    const result = await query;

    return new Response(
      JSON.stringify({
        success: true,
        projects: result,
        count: result.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching projects:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch projects',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.projectNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: name, projectNumber'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if project number already exists
    const existing = await db.select()
      .from(projects)
      .where(eq(projects.projectNumber, body.projectNumber))
      .limit(1);

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project number already exists'
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new project
    const newProject = {
      name: body.name,
      description: body.description || null,
      status: body.status || 'planning',
      projectNumber: body.projectNumber,

      // Location
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,

      // Budget
      totalBudget: body.totalBudget || body.budget?.total || 0,
      spentBudget: 0,
      allocatedBudget: 0,
      committedBudget: 0,
      remainingBudget: body.totalBudget || body.budget?.total || 0,

      // Dates
      startDate: body.startDate ? new Date(body.startDate) : null,
      estimatedCompletion: body.estimatedCompletion ? new Date(body.estimatedCompletion) : null,
      actualCompletion: null,

      // Team
      ownerId: body.ownerId || null,
      generalContractorId: body.generalContractorId || body.createdBy || null,
      teamMembers: body.teamMembers || [],

      // Progress
      progressPercentage: 0,
      completedMilestones: 0,
      totalMilestones: body.milestones?.length || 0,

      // Metadata
      tags: body.tags || [],
      settings: body.settings || {},
      createdBy: body.createdBy || body.generalContractorId || null,
    };

    // Insert project
    const result = await db.insert(projects).values(newProject).returning();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Project created successfully',
        projectId: result[0].id,
        project: result[0]
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating project:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create project',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
