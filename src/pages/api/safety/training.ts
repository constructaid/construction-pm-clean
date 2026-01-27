/**
 * Safety Training API - CRUD operations for safety training records
 * Tracks OSHA training, certifications, and attendance
 * SECURED with RBAC middleware
 */
import type { APIRoute} from 'astro';
import { db } from '../../../lib/db';
import { safetyTraining } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/safety/training?projectId=1
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');

    if (!projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required parameter: projectId'
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const conditions = [eq(safetyTraining.projectId, parseInt(projectId))];
    if (status) conditions.push(eq(safetyTraining.status, status as any));

    const trainings = await db.select().from(safetyTraining).where(and(...conditions)).orderBy(desc(safetyTraining.trainingDate));

    return new Response(JSON.stringify({ trainings, total: trainings.length }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching safety training:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch safety training' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/safety/training
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

    if (!body.trainingNumber) {
      const count = await db.select().from(safetyTraining).where(eq(safetyTraining.projectId, body.projectId));
      body.trainingNumber = `TRN-${String(count.length + 1).padStart(4, '0')}`;
    }

    const [newTraining] = await db.insert(safetyTraining).values({
      ...body,
      trainingDate: new Date(body.trainingDate),
      attendees: body.attendees || [],
      topicsCovered: body.topicsCovered || [],
      materialsProvided: body.materialsProvided || [],
      attachments: body.attachments || [],
      createdBy: user.id,
    }).returning();

    return new Response(JSON.stringify({ training: newTraining }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create training record' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/safety/training
export const PUT: APIRoute = async (context) => {
  try {
    const { request } = context;
    const { id, projectId, ...updateData } = await request.json();

    if (!id || !projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: id, projectId'
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    if (updateData.trainingDate) updateData.trainingDate = new Date(updateData.trainingDate);

    const [updated] = await db.update(safetyTraining).set({...updateData, updatedAt: new Date() })
      .where(eq(safetyTraining.id, id)).returning();

    return new Response(JSON.stringify({ training: updated }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update training record' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/safety/training?id=123&projectId=1
export const DELETE: APIRoute = async (context) => {
  try {
    const { url } = context;
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');

    if (!id || !projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: id, projectId'
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    // RBAC: Require authentication and project delete access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canDelete');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    await db.delete(safetyTraining).where(eq(safetyTraining.id, parseInt(id)));
    return new Response(JSON.stringify({ message: 'Training record deleted' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete training record' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
