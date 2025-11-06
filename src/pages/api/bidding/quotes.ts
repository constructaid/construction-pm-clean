/**
 * Subcontractor Quotes API - List and Create
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { subcontractorQuotes } from '../../../lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET - List all quotes for a project or estimate
export const GET: APIRoute = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId');
    const estimateId = url.searchParams.get('estimateId');
    const bidPackageId = url.searchParams.get('bidPackageId');

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
export const POST: APIRoute = async ({ request }) => {
  try {
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
