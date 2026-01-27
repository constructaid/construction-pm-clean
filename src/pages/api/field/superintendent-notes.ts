/**
 * Superintendent Notes API - CRUD operations for daily field notes and action items
 * Critical for field superintendent documentation and follow-up tracking
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { superintendentNotes } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/field/superintendent-notes?projectId=1&category=daily_notes
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const category = url.searchParams.get('category');
    const priority = url.searchParams.get('priority');
    const status = url.searchParams.get('status');
    const date = url.searchParams.get('date');

    if (!projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required parameter: projectId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const conditions = [eq(superintendentNotes.projectId, parseInt(projectId))];

    if (category) {
      conditions.push(eq(superintendentNotes.category, category as any));
    }

    if (priority) {
      conditions.push(eq(superintendentNotes.priority, priority as any));
    }

    if (status) {
      conditions.push(eq(superintendentNotes.status, status as any));
    }

    const notes = await db
      .select()
      .from(superintendentNotes)
      .where(and(...conditions))
      .orderBy(desc(superintendentNotes.noteDate));

    return new Response(JSON.stringify({
      notes,
      total: notes.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching superintendent notes:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch superintendent notes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/field/superintendent-notes - Create a new note
export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, body.projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const { user } = rbacResult;

    // Generate note number if not provided
    if (!body.noteNumber) {
      const existingCount = await db
        .select()
        .from(superintendentNotes)
        .where(eq(superintendentNotes.projectId, body.projectId));

      body.noteNumber = `SN-${String(existingCount.length + 1).padStart(4, '0')}`;
    }

    const [newNote] = await db
      .insert(superintendentNotes)
      .values({
        projectId: body.projectId,
        noteNumber: body.noteNumber,
        category: body.category,
        noteDate: new Date(body.noteDate),
        title: body.title,
        description: body.description,
        weatherConditions: body.weatherConditions,
        temperature: body.temperature,
        workPerformed: body.workPerformed || [],
        crewsOnSite: body.crewsOnSite || [],
        visitorsOnSite: body.visitorsOnSite || [],
        deliveries: body.deliveries || [],
        equipmentOnSite: body.equipmentOnSite || [],
        safetyObservations: body.safetyObservations,
        safetyIssues: body.safetyIssues || [],
        qualityObservations: body.qualityObservations,
        qualityIssues: body.qualityIssues || [],
        delaysEncountered: body.delaysEncountered || [],
        delayImpact: body.delayImpact,
        coordinationIssues: body.coordinationIssues || [],
        actionItems: body.actionItems || [],
        assignedTo: body.assignedTo,
        assignedToName: body.assignedToName,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority || 'medium',
        status: body.status || 'open',
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        completedBy: body.completedBy,
        followUpRequired: body.followUpRequired || false,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        photos: body.photos || [],
        attachments: body.attachments || [],
        tags: body.tags || [],
        superintendentName: user.name,
        createdBy: user.id,
      })
      .returning();

    return new Response(JSON.stringify({
      note: newNote,
      message: 'Superintendent note created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating superintendent note:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create superintendent note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/field/superintendent-notes - Update a note
export const PUT: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const { id, projectId, ...updateData } = body;

    if (!id || !projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: id, projectId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Convert date fields
    const dateFields = [
      'noteDate',
      'dueDate',
      'completedAt',
      'followUpDate'
    ];

    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    const [updatedNote] = await db
      .update(superintendentNotes)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(superintendentNotes.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      note: updatedNote,
      message: 'Superintendent note updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating superintendent note:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update superintendent note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/field/superintendent-notes?id=123&projectId=1
export const DELETE: APIRoute = async (context) => {
  try {
    const { url } = context;
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');

    if (!id || !projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: id, projectId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication and project delete access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canDelete');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    await db
      .delete(superintendentNotes)
      .where(eq(superintendentNotes.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Superintendent note deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting superintendent note:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete superintendent note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
