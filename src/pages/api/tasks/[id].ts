/**
 * Task Update API Endpoint
 * Handles updating individual task properties
 * PATCH /api/tasks/:id
 */
import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db/mongodb';
import { TaskStatus } from '../../../lib/db/schemas/Task';
import { ObjectId } from 'mongodb';

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Task ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const updates = await request.json();

    // Connect to database
    const { db } = await connectToDatabase();
    const tasksCollection = db.collection('tasks');

    // Build update object
    const updateDoc: any = {
      updatedAt: new Date()
    };

    // Only allow certain fields to be updated
    if (updates.status && Object.values(TaskStatus).includes(updates.status)) {
      updateDoc.status = updates.status;

      // If completing task, set completedDate
      if (updates.status === TaskStatus.COMPLETED) {
        updateDoc.completedDate = new Date();
      }
    }

    if (updates.priority) {
      updateDoc.priority = updates.priority;
    }

    if (updates.dueDate) {
      updateDoc.dueDate = new Date(updates.dueDate);
    }

    if (updates.title) {
      updateDoc.title = updates.title;
    }

    if (updates.description !== undefined) {
      updateDoc.description = updates.description;
    }

    // Update task
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
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
