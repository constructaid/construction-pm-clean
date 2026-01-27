/**
 * Cost Estimate Line Items API Endpoint
 * Handles CRUD operations for line items within estimates
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { costEstimateLineItems, costEstimates } from '../../../lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';

// Helper to get projectId from estimate
async function getProjectIdFromEstimate(estimateId: number): Promise<number | null> {
  const [est] = await db
    .select({ projectId: costEstimates.projectId })
    .from(costEstimates)
    .where(eq(costEstimates.id, estimateId));
  return est?.projectId || null;
}

export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const estimateId = url.searchParams.get('estimateId');

    if (!estimateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get projectId from estimate for RBAC check
    const projectId = await getProjectIdFromEstimate(parseInt(estimateId));
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, projectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Fetch all line items for the estimate
    const lineItems = await db
      .select()
      .from(costEstimateLineItems)
      .where(eq(costEstimateLineItems.costEstimateId, parseInt(estimateId)))
      .orderBy(costEstimateLineItems.csiDivision, costEstimateLineItems.sortOrder);

    // Group by CSI division
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
        lineItems,
        lineItemsByDivision,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching line items:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch line items' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();

    const {
      costEstimateId,
      csiDivision,
      csiSection,
      description,
      quantity,
      unit,
      unitCost,
      laborCost,
      materialCost,
      equipmentCost,
      subcontractorCost,
      takeoffReference,
      vendorQuote,
      sortOrder,
    } = body;

    // Validate required fields
    if (!costEstimateId || !description) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get projectId from estimate for RBAC check
    const projectId = await getProjectIdFromEstimate(parseInt(costEstimateId));
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Calculate total cost
    const totalCost = (unitCost || 0) * (quantity || 1) +
      (laborCost || 0) +
      (materialCost || 0) +
      (equipmentCost || 0) +
      (subcontractorCost || 0);

    // Create the line item
    const [newLineItem] = await db
      .insert(costEstimateLineItems)
      .values({
        costEstimateId: parseInt(costEstimateId),
        csiDivision: csiDivision || null,
        csiSection: csiSection || null,
        description,
        quantity: quantity || 1,
        unit: unit || null,
        unitCost: unitCost || 0,
        laborCost: laborCost || 0,
        materialCost: materialCost || 0,
        equipmentCost: equipmentCost || 0,
        subcontractorCost: subcontractorCost || 0,
        totalCost,
        takeoffReference: takeoffReference || null,
        vendorQuote: vendorQuote || null,
        sortOrder: sortOrder || 0,
      })
      .returning();

    // Recalculate estimate totals
    await recalculateEstimate(parseInt(costEstimateId));

    return new Response(
      JSON.stringify({
        success: true,
        lineItem: newLineItem,
        message: 'Line item created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating line item:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create line item' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const { id, costEstimateId, ...updateData } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Line item ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the line item to find the estimate and project
    const [existingItem] = await db
      .select()
      .from(costEstimateLineItems)
      .where(eq(costEstimateLineItems.id, parseInt(id)));

    if (!existingItem) {
      return new Response(
        JSON.stringify({ success: false, error: 'Line item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get projectId from estimate for RBAC check
    const projectId = await getProjectIdFromEstimate(existingItem.costEstimateId);
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Recalculate total cost if any cost fields changed
    if (updateData.quantity !== undefined || updateData.unitCost !== undefined ||
        updateData.laborCost !== undefined || updateData.materialCost !== undefined ||
        updateData.equipmentCost !== undefined || updateData.subcontractorCost !== undefined) {

      const quantity = updateData.quantity !== undefined ? updateData.quantity : existingItem.quantity;
      const unitCost = updateData.unitCost !== undefined ? updateData.unitCost : existingItem.unitCost;
      const laborCost = updateData.laborCost !== undefined ? updateData.laborCost : existingItem.laborCost;
      const materialCost = updateData.materialCost !== undefined ? updateData.materialCost : existingItem.materialCost;
      const equipmentCost = updateData.equipmentCost !== undefined ? updateData.equipmentCost : existingItem.equipmentCost;
      const subcontractorCost = updateData.subcontractorCost !== undefined ? updateData.subcontractorCost : existingItem.subcontractorCost;

      updateData.totalCost = (unitCost || 0) * (quantity || 1) +
        (laborCost || 0) +
        (materialCost || 0) +
        (equipmentCost || 0) +
        (subcontractorCost || 0);
    }

    const [updatedLineItem] = await db
      .update(costEstimateLineItems)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(costEstimateLineItems.id, parseInt(id)))
      .returning();

    // Recalculate estimate totals
    await recalculateEstimate(updatedLineItem.costEstimateId);

    return new Response(
      JSON.stringify({
        success: true,
        lineItem: updatedLineItem,
        message: 'Line item updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating line item:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update line item' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const { url } = context;
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Line item ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the line item to find its estimate ID
    const [lineItem] = await db
      .select()
      .from(costEstimateLineItems)
      .where(eq(costEstimateLineItems.id, parseInt(id)));

    if (!lineItem) {
      return new Response(
        JSON.stringify({ success: false, error: 'Line item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get projectId from estimate for RBAC check
    const projectId = await getProjectIdFromEstimate(lineItem.costEstimateId);
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project delete access
    const rbacResult = await checkRBAC(context, projectId, 'canDelete');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Delete the line item
    await db
      .delete(costEstimateLineItems)
      .where(eq(costEstimateLineItems.id, parseInt(id)));

    // Recalculate estimate totals
    await recalculateEstimate(lineItem.costEstimateId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Line item deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting line item:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete line item' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Recalculates estimate totals based on line items
 */
async function recalculateEstimate(estimateId: number) {
  try {
    // Get the estimate
    const [estimate] = await db
      .select()
      .from(costEstimates)
      .where(eq(costEstimates.id, estimateId));

    if (!estimate) return;

    // Get all line items
    const lineItems = await db
      .select()
      .from(costEstimateLineItems)
      .where(eq(costEstimateLineItems.costEstimateId, estimateId));

    // Calculate subtotal from all line items
    const subtotalCost = lineItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    // Calculate markups
    const overhead = Math.round(subtotalCost * (estimate.overheadPercentage || 0) / 100);
    const profit = Math.round(subtotalCost * (estimate.profitPercentage || 0) / 100);
    const bondCost = Math.round(subtotalCost * (estimate.bondPercentage || 0) / 100);
    const contingency = Math.round(subtotalCost * (estimate.contingencyPercentage || 0) / 100);

    const totalEstimatedCost = subtotalCost + overhead + profit + bondCost + contingency + (estimate.generalConditions || 0);

    // Update the estimate
    await db
      .update(costEstimates)
      .set({
        subtotalCost,
        overhead,
        profit,
        bondCost,
        contingency,
        totalEstimatedCost,
        updatedAt: new Date(),
      })
      .where(eq(costEstimates.id, estimateId));
  } catch (error) {
    console.error('Error recalculating estimate:', error);
  }
}
