/**
 * Projects API Endpoint
 * Handles CRUD operations for projects
 * GET /api/projects - Fetch projects for a user
 * POST /api/projects - Create new project
 */
import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../lib/db/mongodb';
import { ProjectStatus } from '../../lib/db/schemas/Project';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const projectsCollection = db.collection('projects');

    // Build query
    const query: any = {
      $or: [
        { 'team.generalContractor': userId },
        { 'team.owner': userId },
        { 'team.architects': userId },
        { 'team.subcontractors.userId': userId },
        { 'team.consultants': userId }
      ]
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch projects
    const projects = await projectsCollection
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return new Response(
      JSON.stringify({
        success: true,
        projects: projects,
        count: projects.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching projects:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch projects'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.projectNumber || !body.location || !body.dates || !body.team) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const projectsCollection = db.collection('projects');

    // Check if project number already exists
    const existingProject = await projectsCollection.findOne({
      projectNumber: body.projectNumber
    });

    if (existingProject) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project number already exists'
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new project document
    const newProject = {
      name: body.name,
      description: body.description || '',
      status: body.status || ProjectStatus.PLANNING,
      projectNumber: body.projectNumber,
      location: body.location,
      budget: {
        total: body.budget?.total || 0,
        allocated: 0,
        spent: 0,
        committed: 0,
        remaining: body.budget?.total || 0
      },
      dates: {
        startDate: new Date(body.dates.startDate),
        estimatedCompletion: new Date(body.dates.estimatedCompletion),
        milestones: body.dates.milestones || []
      },
      team: body.team,
      progress: {
        percentage: 0,
        lastUpdated: new Date(),
        completedMilestones: 0,
        totalMilestones: body.dates.milestones?.length || 0
      },
      settings: {
        timezone: body.settings?.timezone || 'America/New_York',
        workingDays: body.settings?.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri'],
        notificationPreferences: {
          dailyReports: true,
          milestoneAlerts: true,
          budgetAlerts: true
        }
      },
      createdBy: body.createdBy || body.team.generalContractor,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: body.tags || []
    };

    // Insert project into database
    const result = await projectsCollection.insertOne(newProject);

    // Update user's project list
    const usersCollection = db.collection('users');
    await usersCollection.updateOne(
      { _id: body.team.generalContractor },
      { $push: { projects: result.insertedId.toString() } }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Project created successfully',
        projectId: result.insertedId.toString()
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating project:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create project'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
