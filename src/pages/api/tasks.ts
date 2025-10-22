/**
 * Tasks API Endpoint
 * Handles task operations including fetching and updating tasks
 * GET /api/tasks - Fetch tasks for a user
 * PATCH /api/tasks/:id - Update task status
 */
import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../lib/db/mongodb';
import { TaskStatus } from '../../lib/db/schemas/Task';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const filter = url.searchParams.get('filter') || 'all';
    const projectId = url.searchParams.get('projectId');

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
    const tasksCollection = db.collection('tasks');

    // Build query
    const query: any = {
      assignedTo: userId,
      status: { $ne: TaskStatus.CANCELLED }
    };

    // Add project filter if provided
    if (projectId) {
      query.projectId = projectId;
    }

    // Add date filter based on filter parameter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'today') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.dueDate = {
        $gte: today,
        $lt: tomorrow
      };
    } else if (filter === 'week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      query.dueDate = {
        $gte: today,
        $lt: nextWeek
      };
    }

    // Fetch tasks
    const tasks = await tasksCollection
      .find(query)
      .sort({ priority: -1, dueDate: 1 })
      .toArray();

    return new Response(
      JSON.stringify({
        success: true,
        tasks: tasks,
        count: tasks.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching tasks:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch tasks'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];

    if (!taskId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Task ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { status, title, priority, dueDate, description } = body;

    // Connect to database
    const { db } = await connectToDatabase();
    const tasksCollection = db.collection('tasks');

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (description !== undefined) updateData.description = description;

    // Update task
    const result = await tasksCollection.updateOne(
      { _id: taskId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Task not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Task updated successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating task:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update task'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.projectId || !body.title || !body.assignedTo) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: projectId, title, assignedTo'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const tasksCollection = db.collection('tasks');

    // Create new task
    const newTask = {
      projectId: body.projectId,
      title: body.title,
      description: body.description || '',
      type: body.type || 'general',
      status: body.status || TaskStatus.PENDING,
      priority: body.priority || 'medium',
      assignedTo: Array.isArray(body.assignedTo) ? body.assignedTo : [body.assignedTo],
      assignedBy: body.assignedBy || body.createdBy,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      autoGenerated: body.autoGenerated || false,
      generatedFrom: body.generatedFrom || undefined,
      checklist: body.checklist || [],
      comments: body.comments || [],
      createdBy: body.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: body.tags || []
    };

    // Insert task
    const result = await tasksCollection.insertOne(newTask);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Task created successfully',
        taskId: result.insertedId.toString()
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating task:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create task'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
