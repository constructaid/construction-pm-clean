/**
 * Safety Action Plans API - CRUD operations for safety action plans
 * Tracks corrective actions, hazard mitigation, and safety improvements
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { safetyActionPlans } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/safety/action-plans?projectId=1&status=open
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');

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

    const conditions = [eq(safetyActionPlans.projectId, parseInt(projectId))];

    if (status) {
      conditions.push(eq(safetyActionPlans.status, status as any));
    }

    if (priority) {
      conditions.push(eq(safetyActionPlans.priority, priority as any));
    }

    const actionPlans = await db
      .select()
      .from(safetyActionPlans)
      .where(and(...conditions))
      .orderBy(desc(safetyActionPlans.createdAt));

    return new Response(JSON.stringify({
      actionPlans,
      total: actionPlans.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching safety action plans:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch safety action plans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/safety/action-plans - Create a new safety action plan
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

    // Generate action plan number if not provided
    if (!body.actionPlanNumber) {
      const existingCount = await db
        .select()
        .from(safetyActionPlans)
        .where(eq(safetyActionPlans.projectId, body.projectId));

      body.actionPlanNumber = `SAP-${String(existingCount.length + 1).padStart(4, '0')}`;
    }

    const [newActionPlan] = await db
      .insert(safetyActionPlans)
      .values({
        projectId: body.projectId,
        actionPlanNumber: body.actionPlanNumber,
        title: body.title,
        description: body.description,
        hazardIdentified: body.hazardIdentified,
        riskLevel: body.riskLevel,
        sourceType: body.sourceType,
        sourceId: body.sourceId,
        correctiveActions: body.correctiveActions || [],
        assignedTo: body.assignedTo,
        assignedToName: body.assignedToName,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority || 'medium',
        status: body.status || 'open',
        implementationSteps: body.implementationSteps || [],
        resourcesNeeded: body.resourcesNeeded || [],
        estimatedCost: body.estimatedCost,
        actualCost: body.actualCost,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        completedBy: body.completedBy,
        verifiedBy: body.verifiedBy,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : null,
        effectiveness: body.effectiveness,
        followUpRequired: body.followUpRequired || false,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        attachments: body.attachments || [],
        notes: body.notes,
        createdBy: user.id,
      })
      .returning();

    return new Response(JSON.stringify({
      actionPlan: newActionPlan,
      message: 'Safety action plan created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating safety action plan:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create safety action plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/safety/action-plans - Update a safety action plan
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
    const dateFields = ['dueDate', 'completedAt', 'verifiedAt', 'followUpDate'];
    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    const [updatedActionPlan] = await db
      .update(safetyActionPlans)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(safetyActionPlans.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      actionPlan: updatedActionPlan,
      message: 'Safety action plan updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating safety action plan:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update safety action plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/safety/action-plans?id=123&projectId=1
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
      .delete(safetyActionPlans)
      .where(eq(safetyActionPlans.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Safety action plan deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting safety action plan:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete safety action plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
