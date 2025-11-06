/**
 * Bid Package Estimates API - Link/unlink estimates to bid packages
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/db';
import { costEstimates } from '../../../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// POST - Link an estimate to a bid package
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params; // bid package ID
    const { estimateId } = await request.json();

    if (!id || !estimateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package ID and estimate ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update estimate to link it to bid package
    const [updated] = await db
      .update(costEstimates)
      .set({
        bidPackageId: parseInt(id),
        updatedAt: new Date(),
      })
      .where(eq(costEstimates.id, parseInt(estimateId)))
      .returning();

    return new Response(
      JSON.stringify({ success: true, estimate: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error linking estimate to bid package:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to link estimate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Unlink an estimate from a bid package
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params; // bid package ID
    const { estimateId } = await request.json();

    if (!id || !estimateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package ID and estimate ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update estimate to unlink it from bid package
    const [updated] = await db
      .update(costEstimates)
      .set({
        bidPackageId: null,
        updatedAt: new Date(),
      })
      .where(eq(costEstimates.id, parseInt(estimateId)))
      .returning();

    return new Response(
      JSON.stringify({ success: true, estimate: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error unlinking estimate from bid package:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to unlink estimate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
