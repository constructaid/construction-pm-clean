/**
 * Bid Checklists API - CRUD operations for bid package checklists
 * Tracks document requirements, insurance, bonding, and compliance items
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { bidChecklists } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// GET /api/bidding/checklists?bidPackageId=1
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const bidPackageId = url.searchParams.get('bidPackageId');
    const projectId = url.searchParams.get('projectId');

    if (!bidPackageId && !projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required parameter: bidPackageId or projectId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, parseInt(projectId!), 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    let conditions = [];

    if (bidPackageId) {
      conditions.push(eq(bidChecklists.bidPackageId, parseInt(bidPackageId)));
    }

    if (projectId) {
      conditions.push(eq(bidChecklists.projectId, parseInt(projectId)));
    }

    const checklists = await db
      .select()
      .from(bidChecklists)
      .where(and(...conditions))
      .orderBy(desc(bidChecklists.createdAt));

    return new Response(JSON.stringify({
      checklists,
      total: checklists.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching bid checklists:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch bid checklists',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/bidding/checklists - Create a new bid checklist
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

    const [newChecklist] = await db
      .insert(bidChecklists)
      .values({
        projectId: body.projectId,
        bidPackageId: body.bidPackageId,
        subcontractorId: body.subcontractorId,
        subcontractorName: body.subcontractorName,
        documentsRequired: body.documentsRequired || [],
        documentsReceived: body.documentsReceived || [],
        insuranceRequired: body.insuranceRequired || false,
        insuranceReceived: body.insuranceReceived || false,
        insuranceExpiryDate: body.insuranceExpiryDate ? new Date(body.insuranceExpiryDate) : null,
        bondingRequired: body.bondingRequired || false,
        bondingReceived: body.bondingReceived || false,
        bondAmount: body.bondAmount,
        licenseVerified: body.licenseVerified || false,
        licenseNumber: body.licenseNumber,
        licenseExpiryDate: body.licenseExpiryDate ? new Date(body.licenseExpiryDate) : null,
        referencesRequired: body.referencesRequired || false,
        referencesReceived: body.referencesReceived || false,
        references: body.references || [],
        mwbeDocumentsRequired: body.mwbeDocumentsRequired || false,
        mwbeDocumentsReceived: body.mwbeDocumentsReceived || false,
        mwbeCertification: body.mwbeCertification,
        safetyProgramReviewed: body.safetyProgramReviewed || false,
        emodVerified: body.emodVerified || false,
        emodRate: body.emodRate,
        oshaViolations: body.oshaViolations || false,
        oshaViolationDetails: body.oshaViolationDetails,
        allItemsComplete: body.allItemsComplete || false,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        reviewedBy: body.reviewedBy,
        reviewedByName: body.reviewedByName,
        notes: body.notes,
        createdBy: user.id,
      })
      .returning();

    return new Response(JSON.stringify({
      checklist: newChecklist,
      message: 'Bid checklist created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating bid checklist:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create bid checklist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/bidding/checklists - Update a bid checklist
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
    const dateFields = ['insuranceExpiryDate', 'licenseExpiryDate', 'completedAt'];
    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    const [updatedChecklist] = await db
      .update(bidChecklists)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(bidChecklists.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      checklist: updatedChecklist,
      message: 'Bid checklist updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating bid checklist:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update bid checklist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/bidding/checklists?id=123&projectId=1
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
      .delete(bidChecklists)
      .where(eq(bidChecklists.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Bid checklist deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting bid checklist:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete bid checklist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
