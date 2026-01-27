/**
 * Contracts API Endpoint
 * GET /api/contracts - List all subcontracts for a project
 * POST /api/contracts - Create a new subcontract
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { subcontracts } from '../../lib/db/contract-schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { checkRBAC } from '../../lib/middleware/rbac';

export const prerender = false;

// GET - List all subcontracts for a project
export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, parseInt(projectId, 10), 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Fetch subcontracts for this project
    const contractsList = await db
      .select()
      .from(subcontracts)
      .where(eq(subcontracts.projectId, parseInt(projectId, 10)))
      .orderBy(desc(subcontracts.createdAt));

    // Transform to match frontend interface
    const contracts = contractsList.map(c => ({
      id: c.id,
      contractNumber: c.contractNumber,
      subcontractorName: c.subcontractorName,
      subcontractorCompany: c.subcontractorCompany,
      subcontractorEmail: c.subcontractorEmail,
      subcontractorPhone: c.subcontractorPhone,
      workDescription: c.workDescription,
      scopeOfWork: c.scopeOfWork,
      csiDivisions: c.csiDivisions,
      contractAmount: parseFloat(c.contractAmount?.toString() || '0'),
      retainagePercentage: parseFloat(c.retainagePercentage?.toString() || '10'),
      status: c.status,
      startDate: c.startDate?.toISOString().split('T')[0] || null,
      completionDate: c.completionDate?.toISOString().split('T')[0] || null,
      signedDate: c.signedDate?.toISOString().split('T')[0] || null,
      xrpWalletAddress: c.xrpWalletAddress,
      xrpEscrowEnabled: c.xrpEscrowEnabled,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return new Response(
      JSON.stringify({ success: true, contracts }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching contracts:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch contracts' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a new subcontract
export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const data = await request.json();

    if (!data.projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, data.projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Validate required fields
    if (!data.subcontractorName || !data.subcontractorCompany || !data.workDescription || !data.contractAmount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: subcontractorName, subcontractorCompany, workDescription, contractAmount',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate contract number
    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(subcontracts)
      .where(eq(subcontracts.projectId, data.projectId));

    const contractNumber = data.contractNumber ||
      `SC-${new Date().getFullYear()}-${String((existingCount[0]?.count || 0) + 1).padStart(3, '0')}`;

    // Insert new subcontract
    const [newContract] = await db
      .insert(subcontracts)
      .values({
        projectId: data.projectId,
        contractNumber,
        subcontractorName: data.subcontractorName,
        subcontractorCompany: data.subcontractorCompany,
        subcontractorAddress: data.subcontractorAddress || null,
        subcontractorEmail: data.subcontractorEmail || null,
        subcontractorPhone: data.subcontractorPhone || null,
        workDescription: data.workDescription,
        scopeOfWork: data.scopeOfWork || null,
        csiDivisions: data.csiDivisions || null,
        contractAmount: data.contractAmount.toString(),
        retainagePercentage: (data.retainagePercentage || 10).toString(),
        startDate: data.startDate ? new Date(data.startDate) : null,
        completionDate: data.completionDate ? new Date(data.completionDate) : null,
        workingDays: data.workingDays || null,
        paymentTerms: data.paymentTerms || 'Net 30',
        billingSchedule: data.billingSchedule || null,
        status: data.status || 'draft',
        xrpWalletAddress: data.xrpWalletAddress || null,
        xrpEscrowEnabled: data.xrpEscrowEnabled || false,
      })
      .returning();

    console.log('Created subcontract:', newContract.id);

    return new Response(
      JSON.stringify({
        success: true,
        contract: {
          ...newContract,
          contractAmount: parseFloat(newContract.contractAmount?.toString() || '0'),
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating contract:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create contract' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a subcontract
export const PUT: APIRoute = async (context) => {
  try {
    const { request } = context;
    const data = await request.json();

    if (!data.id || !data.projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'id and projectId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, data.projectId, 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (data.subcontractorName !== undefined) updateData.subcontractorName = data.subcontractorName;
    if (data.subcontractorCompany !== undefined) updateData.subcontractorCompany = data.subcontractorCompany;
    if (data.subcontractorAddress !== undefined) updateData.subcontractorAddress = data.subcontractorAddress;
    if (data.subcontractorEmail !== undefined) updateData.subcontractorEmail = data.subcontractorEmail;
    if (data.subcontractorPhone !== undefined) updateData.subcontractorPhone = data.subcontractorPhone;
    if (data.workDescription !== undefined) updateData.workDescription = data.workDescription;
    if (data.scopeOfWork !== undefined) updateData.scopeOfWork = data.scopeOfWork;
    if (data.csiDivisions !== undefined) updateData.csiDivisions = data.csiDivisions;
    if (data.contractAmount !== undefined) updateData.contractAmount = data.contractAmount.toString();
    if (data.retainagePercentage !== undefined) updateData.retainagePercentage = data.retainagePercentage.toString();
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.completionDate !== undefined) updateData.completionDate = data.completionDate ? new Date(data.completionDate) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.signedDate !== undefined) updateData.signedDate = data.signedDate ? new Date(data.signedDate) : null;
    if (data.signedBy !== undefined) updateData.signedBy = data.signedBy;
    if (data.xrpWalletAddress !== undefined) updateData.xrpWalletAddress = data.xrpWalletAddress;
    if (data.xrpEscrowEnabled !== undefined) updateData.xrpEscrowEnabled = data.xrpEscrowEnabled;

    const [updatedContract] = await db
      .update(subcontracts)
      .set(updateData)
      .where(and(
        eq(subcontracts.id, data.id),
        eq(subcontracts.projectId, data.projectId)
      ))
      .returning();

    if (!updatedContract) {
      return new Response(
        JSON.stringify({ success: false, error: 'Contract not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        contract: {
          ...updatedContract,
          contractAmount: parseFloat(updatedContract.contractAmount?.toString() || '0'),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating contract:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update contract' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete a subcontract
export const DELETE: APIRoute = async (context) => {
  try {
    const { url } = context;
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');

    if (!id || !projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'id and projectId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project delete access
    const rbacResult = await checkRBAC(context, parseInt(projectId, 10), 'canDelete');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    await db
      .delete(subcontracts)
      .where(and(
        eq(subcontracts.id, parseInt(id, 10)),
        eq(subcontracts.projectId, parseInt(projectId, 10))
      ));

    return new Response(
      JSON.stringify({ success: true, message: 'Contract deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deleting contract:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete contract' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
