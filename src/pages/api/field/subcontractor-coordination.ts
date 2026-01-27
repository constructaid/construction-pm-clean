/**
 * Subcontractor Coordination API - CRUD operations for subcontractor coordination
 * Tracks work scheduling, prerequisites, insurance, and badge verification
 * Critical for field superintendent coordination workflow
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { subcontractorCoordination } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/field/subcontractor-coordination?projectId=1&status=active
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');
    const subcontractorCompany = url.searchParams.get('subcontractorCompany');

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

    const conditions = [eq(subcontractorCoordination.projectId, parseInt(projectId))];

    if (status) {
      conditions.push(eq(subcontractorCoordination.status, status as any));
    }

    if (subcontractorCompany) {
      conditions.push(eq(subcontractorCoordination.subcontractorCompany, subcontractorCompany));
    }

    const coordinations = await db
      .select()
      .from(subcontractorCoordination)
      .where(and(...conditions))
      .orderBy(desc(subcontractorCoordination.scheduledStartDate));

    return new Response(JSON.stringify({
      coordinations,
      total: coordinations.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching subcontractor coordination:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch subcontractor coordination',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/field/subcontractor-coordination - Create a new coordination record
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

    // Generate coordination number if not provided
    if (!body.coordinationNumber) {
      const existingCount = await db
        .select()
        .from(subcontractorCoordination)
        .where(eq(subcontractorCoordination.projectId, body.projectId));

      body.coordinationNumber = `SC-${String(existingCount.length + 1).padStart(4, '0')}`;
    }

    const [newCoordination] = await db
      .insert(subcontractorCoordination)
      .values({
        projectId: body.projectId,
        coordinationNumber: body.coordinationNumber,
        subcontractorCompany: body.subcontractorCompany,
        trade: body.trade,
        contactPerson: body.contactPerson,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        workDescription: body.workDescription,
        scheduledStartDate: new Date(body.scheduledStartDate),
        scheduledEndDate: new Date(body.scheduledEndDate),
        estimatedManpower: body.estimatedManpower,
        actualStartDate: body.actualStartDate ? new Date(body.actualStartDate) : null,
        actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
        actualManpower: body.actualManpower,
        workLocation: body.workLocation,
        workArea: body.workArea,
        prerequisites: body.prerequisites || [],
        prerequisitesComplete: body.prerequisitesComplete || false,
        prerequisiteNotes: body.prerequisiteNotes,
        materialsNeeded: body.materialsNeeded || [],
        materialsOnSite: body.materialsOnSite || false,
        equipmentNeeded: body.equipmentNeeded || [],
        equipmentOnSite: body.equipmentOnSite || false,
        insuranceVerified: body.insuranceVerified || false,
        insuranceExpiryDate: body.insuranceExpiryDate ? new Date(body.insuranceExpiryDate) : null,
        workerBadgesVerified: body.workerBadgesVerified || false,
        badgeNumbers: body.badgeNumbers || [],
        safetyOrientationComplete: body.safetyOrientationComplete || false,
        permitRequired: body.permitRequired || false,
        permitNumber: body.permitNumber,
        jhaRequired: body.jhaRequired || false,
        jhaNumber: body.jhaNumber,
        coordinationIssues: body.coordinationIssues || [],
        delayReasons: body.delayReasons || [],
        status: body.status || 'scheduled',
        completionPercentage: body.completionPercentage || 0,
        qualityIssues: body.qualityIssues || [],
        safetyIssues: body.safetyIssues || [],
        nextScheduledDate: body.nextScheduledDate ? new Date(body.nextScheduledDate) : null,
        attachments: body.attachments || [],
        notes: body.notes,
        createdBy: user.id,
        superintendentName: user.name,
      })
      .returning();

    return new Response(JSON.stringify({
      coordination: newCoordination,
      message: 'Subcontractor coordination created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating subcontractor coordination:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create subcontractor coordination',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/field/subcontractor-coordination - Update a coordination record
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
      'scheduledStartDate',
      'scheduledEndDate',
      'actualStartDate',
      'actualEndDate',
      'insuranceExpiryDate',
      'nextScheduledDate'
    ];

    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    const [updatedCoordination] = await db
      .update(subcontractorCoordination)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(subcontractorCoordination.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      coordination: updatedCoordination,
      message: 'Subcontractor coordination updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating subcontractor coordination:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update subcontractor coordination',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/field/subcontractor-coordination?id=123&projectId=1
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
      .delete(subcontractorCoordination)
      .where(eq(subcontractorCoordination.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Subcontractor coordination deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting subcontractor coordination:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete subcontractor coordination',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
