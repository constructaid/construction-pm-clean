/**
 * Subcontractor Quote Detail API - Get, Update, Delete
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { subcontractorQuotes } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Get quote details
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [quote] = await db
      .select()
      .from(subcontractorQuotes)
      .where(eq(subcontractorQuotes.id, parseInt(id)));

    if (!quote) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, quote }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching quote:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch quote' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PATCH - Update quote
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };

    if (data.subcontractorName !== undefined) updateData.subcontractorName = data.subcontractorName;
    if (data.subcontractorEmail !== undefined) updateData.subcontractorEmail = data.subcontractorEmail;
    if (data.subcontractorPhone !== undefined) updateData.subcontractorPhone = data.subcontractorPhone;
    if (data.quoteNumber !== undefined) updateData.quoteNumber = data.quoteNumber;
    if (data.csiDivision !== undefined) updateData.csiDivision = data.csiDivision;
    if (data.scopeOfWork !== undefined) updateData.scopeOfWork = data.scopeOfWork;
    if (data.quotedAmount !== undefined) updateData.quotedAmount = parseInt(data.quotedAmount);
    if (data.taxAmount !== undefined) updateData.taxAmount = parseInt(data.taxAmount);
    if (data.totalAmount !== undefined) updateData.totalAmount = parseInt(data.totalAmount);
    if (data.isAccepted !== undefined) updateData.isAccepted = data.isAccepted;
    if (data.isIncludedInBid !== undefined) updateData.isIncludedInBid = data.isIncludedInBid;
    if (data.quoteDate !== undefined) updateData.quoteDate = new Date(data.quoteDate);
    if (data.quoteValidUntil !== undefined) updateData.quoteValidUntil = new Date(data.quoteValidUntil);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updated] = await db
      .update(subcontractorQuotes)
      .set(updateData)
      .where(eq(subcontractorQuotes.id, parseInt(id)))
      .returning();

    return new Response(
      JSON.stringify({ success: true, quote: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating quote:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update quote' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete quote
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.delete(subcontractorQuotes).where(eq(subcontractorQuotes.id, parseInt(id)));

    return new Response(
      JSON.stringify({ success: true, message: 'Quote deleted' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting quote:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete quote' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
