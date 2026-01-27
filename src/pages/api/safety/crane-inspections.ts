/**
 * Crane Inspections API - CRUD operations for crane inspection records
 * Supports daily, weekly, monthly, and annual inspections
 * Critical for OSHA 1926.1412-1427 compliance
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { craneInspections } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/safety/crane-inspections?projectId=1&inspectionType=daily
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const inspectionType = url.searchParams.get('inspectionType');
    const craneId = url.searchParams.get('craneId');
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

    const conditions = [eq(craneInspections.projectId, parseInt(projectId))];

    if (inspectionType) {
      conditions.push(eq(craneInspections.inspectionType, inspectionType as any));
    }

    if (craneId) {
      conditions.push(eq(craneInspections.craneId, craneId));
    }

    if (status) {
      conditions.push(eq(craneInspections.status, status as any));
    }

    const inspections = await db
      .select()
      .from(craneInspections)
      .where(and(...conditions))
      .orderBy(desc(craneInspections.inspectionDate));

    return new Response(JSON.stringify({
      inspections,
      total: inspections.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching crane inspections:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch crane inspections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/safety/crane-inspections - Create a new crane inspection
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

    // Generate inspection number if not provided
    if (!body.inspectionNumber) {
      const existingCount = await db
        .select()
        .from(craneInspections)
        .where(eq(craneInspections.projectId, body.projectId));

      body.inspectionNumber = `CI-${String(existingCount.length + 1).padStart(4, '0')}`;
    }

    const [newInspection] = await db
      .insert(craneInspections)
      .values({
        projectId: body.projectId,
        inspectionNumber: body.inspectionNumber,
        inspectionType: body.inspectionType,
        inspectionDate: new Date(body.inspectionDate),
        craneId: body.craneId,
        craneType: body.craneType,
        manufacturer: body.manufacturer,
        model: body.model,
        serialNumber: body.serialNumber,
        capacity: body.capacity,
        boomLength: body.boomLength,
        lastCertificationDate: body.lastCertificationDate ? new Date(body.lastCertificationDate) : null,
        nextCertificationDue: body.nextCertificationDue ? new Date(body.nextCertificationDue) : null,
        operatorName: body.operatorName,
        operatorCertification: body.operatorCertification,
        operatorCertExpiry: body.operatorCertExpiry ? new Date(body.operatorCertExpiry) : null,
        inspectorName: body.inspectorName,
        inspectorCertification: body.inspectorCertification,
        visualInspection: body.visualInspection || [],
        functionalTests: body.functionalTests || [],
        loadTests: body.loadTests || [],
        wirerope: body.wirerope,
        wireropeCutoffs: body.wireropeCutoffs || 0,
        hooks: body.hooks,
        safetyDevices: body.safetyDevices || [],
        electricalSystems: body.electricalSystems,
        hydraulicSystems: body.hydraulicSystems,
        deficienciesFound: body.deficienciesFound || [],
        correctiveActions: body.correctiveActions || [],
        weatherConditions: body.weatherConditions,
        windSpeed: body.windSpeed,
        groundConditions: body.groundConditions,
        outriggers: body.outriggers,
        levelness: body.levelness,
        criticalLift: body.criticalLift || false,
        liftPlan: body.liftPlan,
        status: body.status || 'pending',
        passedInspection: body.passedInspection,
        nextInspectionDue: body.nextInspectionDue ? new Date(body.nextInspectionDue) : null,
        approvedBy: body.approvedBy,
        approvedByName: body.approvedByName,
        approvedAt: body.approvedAt ? new Date(body.approvedAt) : null,
        attachments: body.attachments || [],
        notes: body.notes,
        createdBy: user.id,
      })
      .returning();

    return new Response(JSON.stringify({
      inspection: newInspection,
      message: 'Crane inspection created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating crane inspection:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create crane inspection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/safety/crane-inspections - Update a crane inspection
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
      'inspectionDate',
      'lastCertificationDate',
      'nextCertificationDue',
      'operatorCertExpiry',
      'nextInspectionDue',
      'approvedAt'
    ];

    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    const [updatedInspection] = await db
      .update(craneInspections)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(craneInspections.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      inspection: updatedInspection,
      message: 'Crane inspection updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating crane inspection:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update crane inspection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/safety/crane-inspections?id=123&projectId=1
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
      .delete(craneInspections)
      .where(eq(craneInspections.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Crane inspection deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting crane inspection:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete crane inspection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
