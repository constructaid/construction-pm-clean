/**
 * Bid Package Detail API - Get, Update, Delete
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { bidPackages, costEstimates, costEstimateLineItems } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkRBAC } from '../../../../lib/middleware/rbac';

// GET - Get bid package details with related estimates
export const GET: APIRoute = async (context) => {
  try {
    const { params } = context;
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get bid package
    const [bidPackage] = await db
      .select()
      .from(bidPackages)
      .where(eq(bidPackages.id, parseInt(id)));

    if (!bidPackage) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, bidPackage.projectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Get related cost estimates
    const estimates = await db
      .select()
      .from(costEstimates)
      .where(eq(costEstimates.bidPackageId, parseInt(id)));

    return new Response(
      JSON.stringify({ success: true, package: bidPackage, estimates }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching bid package:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch bid package' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PATCH - Update bid package
export const PATCH: APIRoute = async (context) => {
  try {
    const { params, request } = context;
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get bid package to find projectId for RBAC check
    const [existingPackage] = await db
      .select({ projectId: bidPackages.projectId })
      .from(bidPackages)
      .where(eq(bidPackages.id, parseInt(id)));

    if (!existingPackage) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, existingPackage.projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.bidType !== undefined) updateData.bidType = data.bidType;
    if (data.ownerType !== undefined) updateData.ownerType = data.ownerType;
    if (data.ownerName !== undefined) updateData.ownerName = data.ownerName;
    if (data.requiresMWBE !== undefined) updateData.requiresMWBE = data.requiresMWBE;
    if (data.mwbeGoalPercentage !== undefined) updateData.mwbeGoalPercentage = data.mwbeGoalPercentage;
    if (data.requiresBidBond !== undefined) updateData.requiresBidBond = data.requiresBidBond;
    if (data.requiresPerformanceBond !== undefined) updateData.requiresPerformanceBond = data.requiresPerformanceBond;
    if (data.requiresPaymentBond !== undefined) updateData.requiresPaymentBond = data.requiresPaymentBond;
    if (data.bidDueDate !== undefined) updateData.bidDueDate = new Date(data.bidDueDate);
    if (data.estimatedContractValue !== undefined) updateData.estimatedContractValue = data.estimatedContractValue;
    if (data.projectDuration !== undefined) updateData.projectDuration = data.projectDuration;

    const [updated] = await db
      .update(bidPackages)
      .set(updateData)
      .where(eq(bidPackages.id, parseInt(id)))
      .returning();

    return new Response(
      JSON.stringify({ success: true, package: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating bid package:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update bid package' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete bid package
export const DELETE: APIRoute = async (context) => {
  try {
    const { params } = context;
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get bid package to find projectId for RBAC check
    const [existingPackage] = await db
      .select({ projectId: bidPackages.projectId })
      .from(bidPackages)
      .where(eq(bidPackages.id, parseInt(id)));

    if (!existingPackage) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project delete access
    const rbacResult = await checkRBAC(context, existingPackage.projectId, 'canDelete');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    await db.delete(bidPackages).where(eq(bidPackages.id, parseInt(id)));

    return new Response(
      JSON.stringify({ success: true, message: 'Bid package deleted' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting bid package:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete bid package' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
