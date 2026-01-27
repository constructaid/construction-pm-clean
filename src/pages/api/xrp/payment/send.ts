/**
 * API: Send XRP Payment
 * POST /api/xrp/payment/send
 * Sends XRP from one wallet to another for milestone payments
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
    const { fromSeed, toAddress, amount, memo, projectId, milestoneId } = body;

    // SECURITY: Require authentication and canManageFinancials permission
    // XRP payments are critical financial operations
    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'projectId is required for XRP payment authorization',
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
    // SECURITY: In production, retrieve encrypted seed from secure vault
    const fromWallet = Wallet.fromSeed(fromSeed);

    // Build memo
    let paymentMemo = memo || '';
    if (projectId && milestoneId) {
      paymentMemo = `ConstructAid Payment - Project: ${projectId}, Milestone: ${milestoneId}`;
    } else if (projectId) {
      paymentMemo = `ConstructAid Payment - Project: ${projectId}`;
    }

    // Send payment
    const result = await xrplService.sendPayment({
      fromWallet,
      toAddress,
      amount,
      memo: paymentMemo,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Payment failed',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get updated balance
    const balance = await xrplService.getAccountBalance(fromWallet.address);

    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          hash: result.hash,
          validated: result.validated,
          fee: result.fee,
          timestamp: result.timestamp,
          from: fromWallet.address,
          to: toAddress,
          amount,
          memo: paymentMemo,
        },
        balance: balance.xrpBalance,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[XRPL API] Payment send failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send payment',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
