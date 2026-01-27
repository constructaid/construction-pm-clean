/**
 * Work Permits API - CRUD operations for work permits
 * Supports Hot Work, Confined Space, Excavation, Electrical, Crane Lift permits
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { workPermits } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/safety/permits?projectId=1&status=active
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');
    const permitType = url.searchParams.get('permitType');
    const isActive = url.searchParams.get('isActive');

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

    const conditions = [eq(workPermits.projectId, parseInt(projectId))];

    if (status) {
      conditions.push(eq(workPermits.status, status as any));
    }

    if (permitType) {
      conditions.push(eq(workPermits.permitType, permitType as any));
    }

    if (isActive === 'true') {
      conditions.push(eq(workPermits.isActive, true));
    }

    const permits = await db
      .select()
      .from(workPermits)
      .where(and(...conditions))
      .orderBy(desc(workPermits.startDate));

    return new Response(JSON.stringify({
      permits,
      total: permits.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching work permits:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch work permits',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/safety/permits - Create a new work permit
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

    // Generate permit number if not provided
    if (!body.permitNumber) {
      const existingCount = await db
        .select()
        .from(workPermits)
        .where(eq(workPermits.projectId, body.projectId));

      const permitTypeCode = body.permitType.toUpperCase().substring(0, 2);
      body.permitNumber = `${permitTypeCode}-${String(existingCount.length + 1).padStart(4, '0')}`;
    }

    const [newPermit] = await db
      .insert(workPermits)
      .values({
        projectId: body.projectId,
        permitNumber: body.permitNumber,
        permitType: body.permitType,
        title: body.title,
        workDescription: body.workDescription,
        location: body.location,
        contractorCompany: body.contractorCompany,
        permitDate: new Date(body.permitDate),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        startTime: body.startTime,
        endTime: body.endTime,
        requestedBy: user.id,
        requestedByName: user.name,
        authorizedBy: body.authorizedBy,
        authorizedByName: body.authorizedByName,
        fireWatch: body.fireWatch,
        safetyChecklist: body.safetyChecklist || [],
        identifiedHazards: body.identifiedHazards || [],
        precautions: body.precautions || [],
        requiredPPE: body.requiredPPE || [],
        requiredEquipment: body.requiredEquipment || [],
        emergencyContact: body.emergencyContact,
        emergencyPhone: body.emergencyPhone,
        emergencyProcedures: body.emergencyProcedures,
        status: body.status || 'pending',
        isActive: body.isActive || false,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        completedBy: body.completedBy,
        completionNotes: body.completionNotes,
        extended: body.extended || false,
        extensionReason: body.extensionReason,
        originalEndDate: body.originalEndDate ? new Date(body.originalEndDate) : null,
        attachments: body.attachments || [],
        createdBy: user.id,
      })
      .returning();

    return new Response(JSON.stringify({
      permit: newPermit,
      message: 'Work permit created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating work permit:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create work permit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/safety/permits - Update a work permit
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
    const dateFields = ['permitDate', 'startDate', 'endDate', 'completedAt', 'originalEndDate'];
    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    const [updatedPermit] = await db
      .update(workPermits)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(workPermits.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      permit: updatedPermit,
      message: 'Work permit updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating work permit:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update work permit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/safety/permits?id=123&projectId=1
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
      .delete(workPermits)
      .where(eq(workPermits.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Work permit deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting work permit:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete work permit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
