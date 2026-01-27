/**
 * Safety Inspections API Endpoint
 * CRUD operations for safety inspections
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { safetyInspections } from '../../../lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

export const GET: APIRoute = async (context) => {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const projectId = parseInt(url.searchParams.get('projectId') || '0');

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, projectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const inspections = await db
      .select()
      .from(safetyInspections)
      .where(eq(safetyInspections.projectId, projectId))
      .orderBy(desc(safetyInspections.inspectionDate));

    return new Response(
      JSON.stringify({ success: true, inspections }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching safety inspections:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch inspections' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const data = await request.json();

    if (!data.projectId || !data.inspectionType || !data.inspectionDate || !data.inspectorName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, data.projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const { user } = rbacResult;

    const [inspection] = await db
      .insert(safetyInspections)
      .values({
        projectId: data.projectId,
        inspectionNumber: data.inspectionNumber,
        inspectionType: data.inspectionType,
        inspectionDate: new Date(data.inspectionDate),
        inspectedBy: data.inspectedBy || user.id, // Use authenticated user ID
        inspectorName: data.inspectorName,
        inspectorCompany: data.inspectorCompany || null,
        areasInspected: JSON.stringify(data.areasInspected || []),
        checklistItems: JSON.stringify(data.checklistItems || []),
        violationsFound: data.violationsFound || 0,
        hazardsIdentified: JSON.stringify(data.hazardsIdentified || []),
        correctiveActions: JSON.stringify(data.correctiveActions || []),
        weatherCondition: data.weatherCondition || null,
        temperature: data.temperature || null,
        overallStatus: data.overallStatus || 'pass',
        comments: data.comments || null,
        requiresFollowUp: data.requiresFollowUp || false,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        followUpCompleted: false,
        photos: JSON.stringify(data.photos || []),
        attachments: JSON.stringify(data.attachments || []),
        createdBy: user.id, // Use authenticated user ID
      })
      .returning();

    return new Response(
      JSON.stringify({ success: true, inspection }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating safety inspection:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create inspection' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
