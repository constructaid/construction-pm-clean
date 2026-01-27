/**
 * API: Create Payment Escrow
 * POST /api/xrp/payment/escrow
 * Creates time-locked escrow for milestone-based payments
 */

import type { APIRoute } from 'astro';
import { getXRPLService } from '../../../../lib/services/xrp-service';
import { Wallet } from 'xrpl';
import { checkRBAC } from '../../../../lib/middleware/rbac';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const {
      fromSeed,
      toAddress,
      amount,
      projectId,
      milestoneId,
      milestoneName,
      daysUntilRelease,
      daysUntilCancel,
    } = body;

    // SECURITY: Require authentication and canManageFinancials permission
    // XRP escrow creation is a critical financial operation
    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'projectId is required for XRP escrow authorization',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rbacResult = await checkRBAC(context, projectId, 'canManageFinancials');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Validation
    if (!fromSeed || !toAddress || !amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: fromSeed, toAddress, amount',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const xrplService = getXRPLService();

    // Recreate wallet from seed
    const fromWallet = Wallet.fromSeed(fromSeed);

    // Calculate timestamps
    const now = Math.floor(Date.now() / 1000);
    const finishAfter = daysUntilRelease ? now + daysUntilRelease * 24 * 60 * 60 : undefined;
    const cancelAfter = daysUntilCancel ? now + daysUntilCancel * 24 * 60 * 60 : undefined;

    // Build memo
    const memo = milestoneName
      ? `ConstructAid Escrow - Project: ${projectId}, Milestone: ${milestoneName}`
      : `ConstructAid Escrow - Project: ${projectId}`;

    // Create escrow
    const result = await xrplService.createEscrow({
      fromWallet,
      toAddress,
      amount,
      finishAfter,
      cancelAfter,
      memo,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Escrow creation failed',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get updated balance
    const balance = await xrplService.getAccountBalance(fromWallet.address);

    return new Response(
      JSON.stringify({
        success: true,
        escrow: {
          hash: result.hash,
          validated: result.validated,
          fee: result.fee,
          timestamp: result.timestamp,
          from: fromWallet.address,
          to: toAddress,
          amount,
          finishAfter: finishAfter ? new Date(finishAfter * 1000).toISOString() : null,
          cancelAfter: cancelAfter ? new Date(cancelAfter * 1000).toISOString() : null,
          memo,
          projectId,
          milestoneId,
          milestoneName,
        },
        balance: balance.xrpBalance,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[XRPL API] Escrow creation failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create escrow',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
