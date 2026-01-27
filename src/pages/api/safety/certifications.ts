/**
 * Worker Certifications API - CRUD operations for worker badges and certifications
 * DISD badge tracking and site access control
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { workerCertifications } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/safety/certifications?projectId=1
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Missing projectId' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const conditions = [eq(workerCertifications.projectId, parseInt(projectId))];
    if (status) conditions.push(eq(workerCertifications.status, status as any));

    const certs = await db.select().from(workerCertifications).where(and(...conditions));

    return new Response(JSON.stringify({ certifications: certs, total: certs.length }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch certifications' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/safety/certifications
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

    const [newCert] = await db.insert(workerCertifications).values({
      ...body,
      badgeIssueDate: new Date(body.badgeIssueDate),
      badgeExpirationDate: body.badgeExpirationDate ? new Date(body.badgeExpirationDate) : null,
      backgroundCheckDate: body.backgroundCheckDate ? new Date(body.backgroundCheckDate) : null,
      lastIncidentDate: body.lastIncidentDate ? new Date(body.lastIncidentDate) : null,
      certifications: body.certifications || [],
      trainingCompleted: body.trainingCompleted || [],
      accessRestrictions: body.accessRestrictions || [],
      attachments: body.attachments || [],
      createdBy: user.id,
    }).returning();

    return new Response(JSON.stringify({ certification: newCert }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create certification' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/safety/certifications
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

    const dateFields = ['badgeIssueDate', 'badgeExpirationDate', 'backgroundCheckDate', 'lastIncidentDate', 'deactivatedAt'];
    dateFields.forEach(field => {
      if (updateData[field]) updateData[field] = new Date(updateData[field]);
    });

    const [updated] = await db.update(workerCertifications).set({ ...updateData, updatedAt: new Date() })
      .where(eq(workerCertifications.id, id)).returning();

    return new Response(JSON.stringify({ certification: updated }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update certification' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/safety/certifications?id=123&projectId=1
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

    await db.delete(workerCertifications).where(eq(workerCertifications.id, parseInt(id)));
    return new Response(JSON.stringify({ message: 'Certification deleted' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete certification' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
