/**
 * Cost Estimates API Endpoint
 * Handles CRUD operations for cost estimates
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { costEstimates, costEstimateLineItems } from '../../../lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all estimates for the project with line item counts
    const estimates = await db
      .select({
        id: costEstimates.id,
        estimateNumber: costEstimates.estimateNumber,
        title: costEstimates.title,
        description: costEstimates.description,
        status: costEstimates.status,
        version: costEstimates.version,
        subtotalCost: costEstimates.subtotalCost,
        generalConditions: costEstimates.generalConditions,
        overhead: costEstimates.overhead,
        overheadPercentage: costEstimates.overheadPercentage,
        profit: costEstimates.profit,
        profitPercentage: costEstimates.profitPercentage,
        bondCost: costEstimates.bondCost,
        bondPercentage: costEstimates.bondPercentage,
        contingency: costEstimates.contingency,
        contingencyPercentage: costEstimates.contingencyPercentage,
        totalEstimatedCost: costEstimates.totalEstimatedCost,
        notes: costEstimates.notes,
        estimatedBy: costEstimates.estimatedBy,
        reviewedBy: costEstimates.reviewedBy,
        approvedBy: costEstimates.approvedBy,
        createdAt: costEstimates.createdAt,
        updatedAt: costEstimates.updatedAt,
        lineItemCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${costEstimateLineItems}
          WHERE ${costEstimateLineItems.costEstimateId} = ${costEstimates.id}
        )`,
      })
      .from(costEstimates)
      .where(eq(costEstimates.projectId, parseInt(projectId)))
      .orderBy(sql`${costEstimates.createdAt} DESC`);

    // Calculate statistics
    const stats = {
      total: estimates.length,
      draft: estimates.filter(e => e.status === 'draft').length,
      in_progress: estimates.filter(e => e.status === 'in_progress').length,
      under_review: estimates.filter(e => e.status === 'under_review').length,
      approved: estimates.filter(e => e.status === 'approved').length,
      rejected: estimates.filter(e => e.status === 'rejected').length,
      finalized: estimates.filter(e => e.status === 'finalized').length,
      total_value: estimates.reduce((sum, e) => sum + (e.totalEstimatedCost || 0), 0),
    };

    return new Response(
      JSON.stringify({
        success: true,
        estimates,
        stats,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch estimates' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      projectId,
      bidPackageId,
      estimateNumber,
      title,
      description,
      version,
      status,
      overheadPercentage,
      profitPercentage,
      bondPercentage,
      contingencyPercentage,
      notes,
      assumptions,
      exclusions,
    } = body;

    // Validate required fields
    if (!projectId || !estimateNumber || !title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the estimate
    const [newEstimate] = await db
      .insert(costEstimates)
      .values({
        projectId: parseInt(projectId),
        bidPackageId: bidPackageId ? parseInt(bidPackageId) : null,
        estimateNumber,
        title,
        description: description || null,
        version: version || 1,
        status: status || 'draft',
        subtotalCost: 0,
        generalConditions: 0,
        overhead: 0,
        overheadPercentage: overheadPercentage || 10,
        profit: 0,
        profitPercentage: profitPercentage || 8,
        bondCost: 0,
        bondPercentage: bondPercentage || 2,
        contingency: 0,
        contingencyPercentage: contingencyPercentage || 5,
        totalEstimatedCost: 0,
        notes: notes || null,
        assumptions: assumptions || null,
        exclusions: exclusions || null,
        estimatedBy: null,
        reviewedBy: null,
        approvedBy: null,
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        estimate: newEstimate,
        message: 'Estimate created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating estimate:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create estimate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [updatedEstimate] = await db
      .update(costEstimates)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(costEstimates.id, parseInt(id)))
      .returning();

    if (!updatedEstimate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        estimate: updatedEstimate,
        message: 'Estimate updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating estimate:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update estimate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete line items first (cascade)
    await db
      .delete(costEstimateLineItems)
      .where(eq(costEstimateLineItems.costEstimateId, parseInt(id)));

    // Delete the estimate
    await db.delete(costEstimates).where(eq(costEstimates.id, parseInt(id)));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Estimate deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete estimate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
