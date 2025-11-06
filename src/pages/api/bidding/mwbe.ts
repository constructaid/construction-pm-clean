/**
 * M/WBE Participation API - List and Create
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { mwbeParticipation } from '../../../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET - List all M/WBE participants for a bid package
export const GET: APIRoute = async ({ url }) => {
  try {
    const bidPackageId = url.searchParams.get('bidPackageId');

    if (!bidPackageId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bid package ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const participants = await db
      .select()
      .from(mwbeParticipation)
      .where(eq(mwbeParticipation.bidPackageId, parseInt(bidPackageId)))
      .orderBy(desc(mwbeParticipation.createdAt));

    // Calculate totals
    const totalContractAmount = participants.reduce((sum, p) => sum + (p.contractAmount || 0), 0);
    const committedAmount = participants.filter(p => p.isCommitted).reduce((sum, p) => sum + (p.contractAmount || 0), 0);
    const awardedAmount = participants.filter(p => p.isAwarded).reduce((sum, p) => sum + (p.contractAmount || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        participants,
        totals: { totalContractAmount, committedAmount, awardedAmount },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching M/WBE participants:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch M/WBE participants' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a new M/WBE participant
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const {
      bidPackageId,
      companyName,
      certificationType,
      certificationNumber,
      csiDivision,
      scopeOfWork,
      contractAmount,
      percentageOfTotal,
      isCommitted,
      isAwarded,
    } = data;

    // Validation
    if (!bidPackageId || !companyName || !scopeOfWork || !contractAmount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Bid package ID, company name, scope, and contract amount are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert participant
    const [newParticipant] = await db
      .insert(mwbeParticipation)
      .values({
        bidPackageId: parseInt(bidPackageId),
        companyName,
        certificationType: certificationType || null,
        certificationNumber: certificationNumber || null,
        csiDivision: csiDivision || null,
        scopeOfWork,
        contractAmount: parseInt(contractAmount),
        percentageOfTotal: percentageOfTotal || null,
        isCommitted: isCommitted || false,
        isAwarded: isAwarded || false,
      })
      .returning();

    return new Response(
      JSON.stringify({ success: true, participant: newParticipant }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating M/WBE participant:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create M/WBE participant' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
