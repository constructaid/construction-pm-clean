/**
 * Single Cost Estimate API Endpoint
 * Handles operations for a specific estimate
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { costEstimates, costEstimateLineItems } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkRBAC } from '../../../../lib/middleware/rbac';

export const GET: APIRoute = async (context) => {
  try {
    const { params } = context;
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the estimate
    const [estimate] = await db
      .select()
      .from(costEstimates)
      .where(eq(costEstimates.id, parseInt(id)));

    if (!estimate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, estimate.projectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Fetch line items for this estimate
    const lineItems = await db
      .select()
      .from(costEstimateLineItems)
      .where(eq(costEstimateLineItems.costEstimateId, parseInt(id)))
      .orderBy(costEstimateLineItems.csiDivision, costEstimateLineItems.sortOrder);

    // Group line items by CSI division
    const lineItemsByDivision = lineItems.reduce((acc, item) => {
      const division = item.csiDivision || 'other';
      if (!acc[division]) {
        acc[division] = [];
      }
      acc[division].push(item);
      return acc;
    }, {} as Record<string, typeof lineItems>);

    return new Response(
      JSON.stringify({
        success: true,
        estimate,
        lineItems,
        lineItemsByDivision,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch estimate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
