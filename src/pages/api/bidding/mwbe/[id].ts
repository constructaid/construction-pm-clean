/**
 * M/WBE Participation Detail API - Get, Update, Delete
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { mwbeParticipation } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Get M/WBE participant details
export const GET: APIRoute = async ({ params }) => {
  try {
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
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Participant ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Participant ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
