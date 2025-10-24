/**
 * Single Project API Endpoint
 * GET /api/projects/[id] - Fetch a single project by ID
 * PUT /api/projects/[id] - Update a project
 * DELETE /api/projects/[id] - Delete a project
 */
import type { APIRoute } from 'astro';
import { db, projects } from '../../../lib/db';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse ID as integer
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid project ID'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch project from database
    const result = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (result.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: result[0]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching project:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch project',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid project ID'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    console.log('PUT /api/projects/' + id, 'Body:', body);

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

    // Check if project exists
    const existing = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (existing.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updateData: any = {
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
      totalBudget: body.totalBudget ? parseFloat(body.totalBudget) : 0,

      // Dates - handle date conversion
      startDate: body.startDate ? new Date(body.startDate) : null,
      estimatedCompletion: body.estimatedCompletion ? new Date(body.estimatedCompletion) : null,
      actualCompletion: body.actualCompletion ? new Date(body.actualCompletion) : null,

      // Team
      ownerId: body.ownerId ? parseInt(body.ownerId) : null,
      generalContractorId: body.generalContractorId ? parseInt(body.generalContractorId) : null,

      // Metadata
      tags: body.tags || [],
      settings: body.settings || {},

      // Update timestamp
      updatedAt: new Date()
    };

    // Update project
    const result = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    console.log('Project updated successfully:', result[0]);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Project updated successfully',
        project: result[0]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating project:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update project',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid project ID'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if project exists
    const existing = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (existing.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete project
    await db.delete(projects)
      .where(eq(projects.id, projectId));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Project deleted successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deleting project:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to delete project',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
