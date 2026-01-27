/**
 * API: Send XRP Payment
 * POST /api/xrp/payment/send
 * Sends XRP from one wallet to another for milestone payments
 *
 * SECURITY: Seeds are retrieved from encrypted database storage, never from client.
 */

import type { APIRoute } from 'astro';
import { getXRPLService } from '../../../../lib/services/xrp-service';
import { Wallet } from 'xrpl';
import { checkRBAC } from '../../../../lib/middleware/rbac';
import { db } from '../../../../lib/db';
import { xrpWallets } from '../../../../lib/db/xrp-schema';
import { eq, and } from 'drizzle-orm';
import { decryptToken, isEncryptionConfigured } from '../../../../lib/auth/encryption';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const { walletId, toAddress, amount, memo, projectId, milestoneId } = body;

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

    // SECURITY: Require encryption to be configured
    if (!isEncryptionConfigured()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server encryption not configured. Contact administrator.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validation - now using walletId instead of seed
    if (!walletId || !toAddress || !amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: walletId, toAddress, amount',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Retrieve wallet from database and verify it belongs to this project
    const [wallet] = await db
      .select()
      .from(xrpWallets)
      .where(
        and(
          eq(xrpWallets.id, parseInt(walletId)),
          eq(xrpWallets.projectId, parseInt(projectId)),
          eq(xrpWallets.isActive, true)
        )
      )
      .limit(1);

    if (!wallet) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Wallet not found or does not belong to this project',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!wallet.encryptedSeed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Wallet seed not available',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Decrypt the seed server-side
    const decryptedSeed = decryptToken(wallet.encryptedSeed);

    const xrplService = getXRPLService();

    // Recreate wallet from decrypted seed
    const fromWallet = Wallet.fromSeed(decryptedSeed);

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
