/**
 * Bid Packages API - List and Create
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { bidPackages, costEstimates } from '../../../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET - List all bid packages for a project
export const GET: APIRoute = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const packages = await db
      .select()
      .from(bidPackages)
      .where(eq(bidPackages.projectId, parseInt(projectId)))
      .orderBy(desc(bidPackages.createdAt));

    return new Response(JSON.stringify({ success: true, packages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching bid packages:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch bid packages' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a new bid package
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const {
      projectId,
      bidNumber,
      title,
      description,
      bidType,
      status,
      ownerType,
      ownerName,
      requiresMWBE,
      mwbeGoalPercentage,
      requiresBidBond,
      requiresPerformanceBond,
      requiresPaymentBond,
      bidDueDate,
      estimatedContractValue,
      projectDuration,
      createdBy,
    } = data;

    // Validation
    if (!projectId || !bidNumber || !title || !bidType || !bidDueDate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project ID, bid number, title, bid type, and bid due date are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert bid package
    const [newPackage] = await db
      .insert(bidPackages)
      .values({
        projectId: parseInt(projectId),
        bidNumber,
        title,
        description: description || null,
        bidType,
        status: status || 'draft',
        ownerType: ownerType || null,
        ownerName: ownerName || null,
        requiresMWBE: requiresMWBE || false,
        mwbeGoalPercentage: mwbeGoalPercentage || null,
        requiresBidBond: requiresBidBond !== undefined ? requiresBidBond : true,
        requiresPerformanceBond: requiresPerformanceBond !== undefined ? requiresPerformanceBond : true,
        requiresPaymentBond: requiresPaymentBond !== undefined ? requiresPaymentBond : true,
        bidDueDate: new Date(bidDueDate),
        estimatedContractValue: estimatedContractValue || null,
        projectDuration: projectDuration || null,
        createdBy: createdBy || 1,
      })
      .returning();

    return new Response(
      JSON.stringify({ success: true, package: newPackage }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating bid package:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create bid package' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
