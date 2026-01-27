/**
 * Incident Reports API - CRUD operations for safety incident reports
 * Supports OSHA recordable tracking and investigation workflow
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { incidentReports } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/safety/incidents?projectId=1
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

    // Build query conditions
    const conditions = [eq(incidentReports.projectId, parseInt(projectId))];
    if (status) {
      conditions.push(eq(incidentReports.status, status as any));
    }

    const incidents = await db
      .select()
      .from(incidentReports)
      .where(and(...conditions))
      .orderBy(desc(incidentReports.incidentDate));

    return new Response(JSON.stringify({
      incidents,
      total: incidents.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching incident reports:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch incident reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/safety/incidents - Create a new incident report
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

    // Generate incident number if not provided
    if (!body.incidentNumber) {
      const existingCount = await db
        .select()
        .from(incidentReports)
        .where(eq(incidentReports.projectId, body.projectId));

      body.incidentNumber = `INC-${String(existingCount.length + 1).padStart(4, '0')}`;
    }

    const [newIncident] = await db
      .insert(incidentReports)
      .values({
        projectId: body.projectId,
        incidentNumber: body.incidentNumber,
        incidentType: body.incidentType,
        severity: body.severity,
        incidentDate: new Date(body.incidentDate),
        incidentTime: body.incidentTime,
        location: body.location,
        specificLocation: body.specificLocation,
        injuredPartyName: body.injuredPartyName,
        injuredPartyCompany: body.injuredPartyCompany,
        injuredPartyTrade: body.injuredPartyTrade,
        injuredPartyBadgeNumber: body.injuredPartyBadgeNumber,
        description: body.description,
        whatHappened: body.whatHappened,
        causeOfIncident: body.causeOfIncident,
        contributingFactors: body.contributingFactors || [],
        bodyPartAffected: body.bodyPartAffected,
        injuryType: body.injuryType,
        treatmentProvided: body.treatmentProvided,
        medicalFacility: body.medicalFacility,
        lostWorkDays: body.lostWorkDays || 0,
        restrictedWorkDays: body.restrictedWorkDays || 0,
        returnToWorkDate: body.returnToWorkDate ? new Date(body.returnToWorkDate) : null,
        isOSHARecordable: body.isOSHARecordable || false,
        osha300FormFiled: body.osha300FormFiled || false,
        osha300FormDate: body.osha300FormDate ? new Date(body.osha300FormDate) : null,
        witnesses: body.witnesses || [],
        investigatedBy: body.investigatedBy,
        investigatorName: body.investigatorName,
        investigationDate: body.investigationDate ? new Date(body.investigationDate) : null,
        investigationFindings: body.investigationFindings,
        rootCause: body.rootCause,
        immediateActions: body.immediateActions,
        correctiveActions: body.correctiveActions || [],
        preventativeMeasures: body.preventativeMeasures,
        bondSafetyNotified: body.bondSafetyNotified || false,
        bondSafetyNotifiedAt: body.bondSafetyNotifiedAt ? new Date(body.bondSafetyNotifiedAt) : null,
        ownerNotified: body.ownerNotified || false,
        ownerNotifiedAt: body.ownerNotifiedAt ? new Date(body.ownerNotifiedAt) : null,
        oshaNotified: body.oshaNotified || false,
        oshaNotifiedAt: body.oshaNotifiedAt ? new Date(body.oshaNotifiedAt) : null,
        photos: body.photos || [],
        attachments: body.attachments || [],
        status: body.status || 'draft',
        reportedBy: user.id,
      })
      .returning();

    return new Response(JSON.stringify({
      incident: newIncident,
      message: 'Incident report created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating incident report:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create incident report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/safety/incidents - Update an incident report
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
      'incidentDate', 'returnToWorkDate', 'osha300FormDate',
      'investigationDate', 'bondSafetyNotifiedAt', 'ownerNotifiedAt', 'oshaNotifiedAt'
    ];

    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    const [updatedIncident] = await db
      .update(incidentReports)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(incidentReports.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      incident: updatedIncident,
      message: 'Incident report updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating incident report:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update incident report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/safety/incidents?id=123&projectId=1
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
      .delete(incidentReports)
      .where(eq(incidentReports.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Incident report deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting incident report:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete incident report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
