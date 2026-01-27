/**
 * API: Create XRPL Wallet
 * POST /api/xrp/wallet/create
 * Generates a new XRPL wallet for project escrow
 */

import type { APIRoute } from 'astro';
import { getXRPLService } from '../../../../lib/services/xrp-service';
import { checkRBAC } from '../../../../lib/middleware/rbac';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const { projectId, fundTestnet = false } = body;

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project ID is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Require authentication and canManageFinancials permission
    // Wallet creation is a critical financial operation
    const rbacResult = await checkRBAC(context, projectId, 'canManageFinancials');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const xrplService = getXRPLService();

    // Generate new wallet
    const walletInfo = xrplService.generateWallet();

    // Fund testnet wallet if requested
    let balance = '0';
    if (fundTestnet) {
      console.log(`[XRPL API] Funding testnet wallet ${walletInfo.address}...`);
      const fundResult = await xrplService.fundTestnetWallet(walletInfo.address);
      if (fundResult.success && fundResult.balance) {
        balance = fundResult.balance;
      }
    }

    // CRITICAL SECURITY NOTE:
    // In production, encrypt and store the seed in a secure vault (e.g., AWS Secrets Manager, Azure Key Vault)
    // NEVER store unencrypted seeds in MongoDB or send them in responses after initial creation

    return new Response(
      JSON.stringify({
        success: true,
        wallet: {
          address: walletInfo.address,
          publicKey: walletInfo.publicKey,
          seed: walletInfo.seed, // Only returned once - client must save securely
          balance,
        },
        network: xrplService.getCurrentNetwork(),
        warning: 'SAVE THE SEED IMMEDIATELY - it will not be shown again',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[XRPL API] Wallet creation failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create wallet',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
