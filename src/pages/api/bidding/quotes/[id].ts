/**
 * Subcontractor Quote Detail API - Get, Update, Delete
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { subcontractorQuotes, costEstimates, bidPackages } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkRBAC } from '../../../../lib/middleware/rbac';

// Helper to get projectId from quote via bid package or estimate
async function getProjectIdFromQuote(quote: { bidPackageId: number | null; costEstimateId: number | null }): Promise<number | null> {
  if (quote.bidPackageId) {
    const [pkg] = await db
      .select({ projectId: bidPackages.projectId })
      .from(bidPackages)
      .where(eq(bidPackages.id, quote.bidPackageId));
    return pkg?.projectId || null;
  }
  if (quote.costEstimateId) {
    const [est] = await db
      .select({ projectId: costEstimates.projectId })
      .from(costEstimates)
      .where(eq(costEstimates.id, quote.costEstimateId));
    return est?.projectId || null;
  }
  return null;
}

// GET - Get quote details
export const GET: APIRoute = async (context) => {
  try {
    const { params } = context;
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

    // Get projectId for RBAC check
    const projectId = await getProjectIdFromQuote(quote);
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to determine project context' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, projectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
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
export const PATCH: APIRoute = async (context) => {
  try {
    const { params, request } = context;
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get quote to find projectId for RBAC check
    const [existingQuote] = await db
      .select()
      .from(subcontractorQuotes)
      .where(eq(subcontractorQuotes.id, parseInt(id)));

    if (!existingQuote) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectId = await getProjectIdFromQuote(existingQuote);
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to determine project context' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
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
export const DELETE: APIRoute = async (context) => {
  try {
    const { params } = context;
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get quote to find projectId for RBAC check
    const [existingQuote] = await db
      .select()
      .from(subcontractorQuotes)
      .where(eq(subcontractorQuotes.id, parseInt(id)));

    if (!existingQuote) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectId = await getProjectIdFromQuote(existingQuote);
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to determine project context' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project delete access
    const rbacResult = await checkRBAC(context, projectId, 'canDelete');
    if (rbacResult instanceof Response) {
      return rbacResult;
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
