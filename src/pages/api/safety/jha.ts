/**
 * Job Hazard Analysis (JHA) API - CRUD operations for JHA worksheets
 * Critical for DISD compliance and safety planning
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { jobHazardAnalyses } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/safety/jha?projectId=1
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');

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

    const conditions = [eq(jobHazardAnalyses.projectId, parseInt(projectId))];
    if (status) {
      conditions.push(eq(jobHazardAnalyses.status, status as any));
    }

    const jhas = await db
      .select()
      .from(jobHazardAnalyses)
      .where(and(...conditions))
      .orderBy(desc(jobHazardAnalyses.createdAt));

    return new Response(JSON.stringify({
      jhas,
      total: jhas.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching JHAs:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch Job Hazard Analyses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/safety/jha - Create a new JHA
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

    // Generate JHA number if not provided
    if (!body.jhaNumber) {
      const existingCount = await db
        .select()
        .from(jobHazardAnalyses)
        .where(eq(jobHazardAnalyses.projectId, body.projectId));

      body.jhaNumber = `JHA-${String(existingCount.length + 1).padStart(4, '0')}`;
    }

    const [newJHA] = await db
      .insert(jobHazardAnalyses)
      .values({
        projectId: body.projectId,
        jhaNumber: body.jhaNumber,
        title: body.title,
        jobDescription: body.jobDescription,
        location: body.location,
        equipmentRequired: body.equipmentRequired || [],
        preparedBy: user.id,
        preparedByName: user.name,
        reviewedBy: body.reviewedBy,
        reviewedByName: body.reviewedByName,
        approvedBy: body.approvedBy,
        approvedByName: body.approvedByName,
        jobSteps: body.jobSteps || [],
        requiredPPE: body.requiredPPE || [],
        trainingRequired: body.trainingRequired || [],
        permitsRequired: body.permitsRequired || [],
        emergencyProcedures: body.emergencyProcedures,
        status: body.status || 'draft',
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : null,
        attachments: body.attachments || [],
        createdBy: user.id,
      })
      .returning();

    return new Response(JSON.stringify({
      jha: newJHA,
      message: 'Job Hazard Analysis created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating JHA:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create Job Hazard Analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/safety/jha - Update a JHA
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
    const dateFields = ['effectiveDate', 'expirationDate', 'reviewDate'];
    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    const [updatedJHA] = await db
      .update(jobHazardAnalyses)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(jobHazardAnalyses.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      jha: updatedJHA,
      message: 'Job Hazard Analysis updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating JHA:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update Job Hazard Analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/safety/jha?id=123&projectId=1
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
      .delete(jobHazardAnalyses)
      .where(eq(jobHazardAnalyses.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Job Hazard Analysis deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting JHA:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete Job Hazard Analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
