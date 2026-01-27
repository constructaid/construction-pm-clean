/**
 * M/WBE Participation Detail API - Get, Update, Delete
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { mwbeParticipation, bidPackages } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkRBAC } from '../../../../lib/middleware/rbac';

// Helper to get projectId from bid package
async function getProjectIdFromBidPackage(bidPackageId: number): Promise<number | null> {
  const [pkg] = await db
    .select({ projectId: bidPackages.projectId })
    .from(bidPackages)
    .where(eq(bidPackages.id, bidPackageId));
  return pkg?.projectId || null;
}

// GET - Get M/WBE participant details
export const GET: APIRoute = async (context) => {
  try {
    const { params } = context;
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Participant ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [participant] = await db
      .select()
      .from(mwbeParticipation)
      .where(eq(mwbeParticipation.id, parseInt(id)));

    if (!participant) {
      return new Response(
        JSON.stringify({ success: false, error: 'Participant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get projectId from bid package for RBAC check
    const projectId = await getProjectIdFromBidPackage(participant.bidPackageId);
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, projectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    return new Response(
      JSON.stringify({ success: true, participant }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching M/WBE participant:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch participant' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PATCH - Update M/WBE participant
export const PATCH: APIRoute = async (context) => {
  try {
    const { params, request } = context;
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Participant ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get participant to find projectId for RBAC check
    const [existingParticipant] = await db
      .select()
      .from(mwbeParticipation)
      .where(eq(mwbeParticipation.id, parseInt(id)));

    if (!existingParticipant) {
      return new Response(
        JSON.stringify({ success: false, error: 'Participant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectId = await getProjectIdFromBidPackage(existingParticipant.bidPackageId);
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };

    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.certificationType !== undefined) updateData.certificationType = data.certificationType;
    if (data.certificationNumber !== undefined) updateData.certificationNumber = data.certificationNumber;
    if (data.csiDivision !== undefined) updateData.csiDivision = data.csiDivision;
    if (data.scopeOfWork !== undefined) updateData.scopeOfWork = data.scopeOfWork;
    if (data.contractAmount !== undefined) updateData.contractAmount = parseInt(data.contractAmount);
    if (data.percentageOfTotal !== undefined) updateData.percentageOfTotal = data.percentageOfTotal;
    if (data.isCommitted !== undefined) updateData.isCommitted = data.isCommitted;
    if (data.isAwarded !== undefined) updateData.isAwarded = data.isAwarded;

    const [updated] = await db
      .update(mwbeParticipation)
      .set(updateData)
      .where(eq(mwbeParticipation.id, parseInt(id)))
      .returning();

    return new Response(
      JSON.stringify({ success: true, participant: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating M/WBE participant:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update participant' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete M/WBE participant
export const DELETE: APIRoute = async (context) => {
  try {
    const { params } = context;
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Participant ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get participant to find projectId for RBAC check
    const [existingParticipant] = await db
      .select()
      .from(mwbeParticipation)
      .where(eq(mwbeParticipation.id, parseInt(id)));

    if (!existingParticipant) {
      return new Response(
        JSON.stringify({ success: false, error: 'Participant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectId = await getProjectIdFromBidPackage(existingParticipant.bidPackageId);
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project delete access
    const rbacResult = await checkRBAC(context, projectId, 'canDelete');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    await db.delete(mwbeParticipation).where(eq(mwbeParticipation.id, parseInt(id)));

    return new Response(
      JSON.stringify({ success: true, message: 'Participant deleted' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting M/WBE participant:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete participant' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
