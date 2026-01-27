/**
 * Subcontractor Quotes API - List and Create
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { subcontractorQuotes, costEstimates, bidPackages } from '../../../lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// Helper to get projectId from bid package or estimate
async function getProjectIdFromQuoteContext(bidPackageId?: number, costEstimateId?: number): Promise<number | null> {
  if (bidPackageId) {
    const [pkg] = await db
      .select({ projectId: bidPackages.projectId })
      .from(bidPackages)
      .where(eq(bidPackages.id, bidPackageId));
    return pkg?.projectId || null;
  }
  if (costEstimateId) {
    const [est] = await db
      .select({ projectId: costEstimates.projectId })
      .from(costEstimates)
      .where(eq(costEstimates.id, costEstimateId));
    return est?.projectId || null;
  }
  return null;
}

// GET - List all quotes for a project or estimate
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');
    const estimateId = url.searchParams.get('estimateId');
    const bidPackageId = url.searchParams.get('bidPackageId');

    // Determine projectId for RBAC check
    let rbacProjectId: number | null = projectId ? parseInt(projectId) : null;

    if (!rbacProjectId && (estimateId || bidPackageId)) {
      rbacProjectId = await getProjectIdFromQuoteContext(
        bidPackageId ? parseInt(bidPackageId) : undefined,
        estimateId ? parseInt(estimateId) : undefined
      );
    }

    if (!rbacProjectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to determine project context for authorization' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, rbacProjectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    let conditions = [];

    if (estimateId) {
      conditions.push(eq(subcontractorQuotes.costEstimateId, parseInt(estimateId)));
    }

    if (bidPackageId) {
      conditions.push(eq(subcontractorQuotes.bidPackageId, parseInt(bidPackageId)));
    }

    const quotes = await db
      .select()
      .from(subcontractorQuotes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(subcontractorQuotes.createdAt));

    return new Response(JSON.stringify({ success: true, quotes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch quotes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a new subcontractor quote
export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const data = await request.json();
    const {
      bidPackageId,
      costEstimateId,
      subcontractorName,
      subcontractorEmail,
      subcontractorPhone,
      quoteNumber,
      csiDivision,
      scopeOfWork,
      quotedAmount,
      taxAmount,
      totalAmount,
      quoteDate,
      quoteValidUntil,
      notes,
    } = data;

    // Validation
    if (!subcontractorName || !csiDivision || !scopeOfWork || !quotedAmount || !totalAmount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Subcontractor name, CSI division, scope, and amounts are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine projectId for RBAC check
    const rbacProjectId = await getProjectIdFromQuoteContext(
      bidPackageId ? parseInt(bidPackageId) : undefined,
      costEstimateId ? parseInt(costEstimateId) : undefined
    );

    if (!rbacProjectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'bidPackageId or costEstimateId is required for authorization' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, rbacProjectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Insert quote
    const [newQuote] = await db
      .insert(subcontractorQuotes)
      .values({
        bidPackageId: bidPackageId ? parseInt(bidPackageId) : null,
        costEstimateId: costEstimateId ? parseInt(costEstimateId) : null,
        subcontractorName,
        subcontractorEmail: subcontractorEmail || null,
        subcontractorPhone: subcontractorPhone || null,
        quoteNumber: quoteNumber || null,
        csiDivision,
        scopeOfWork,
        quotedAmount: parseInt(quotedAmount),
        taxAmount: taxAmount ? parseInt(taxAmount) : 0,
        totalAmount: parseInt(totalAmount),
        isAccepted: false,
        isIncludedInBid: false,
        quoteDate: quoteDate ? new Date(quoteDate) : null,
        quoteValidUntil: quoteValidUntil ? new Date(quoteValidUntil) : null,
        notes: notes || null,
      })
      .returning();

    return new Response(
      JSON.stringify({ success: true, quote: newQuote }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating quote:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create quote' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
