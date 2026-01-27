/**
 * API: Create XRPL Wallet
 * POST /api/xrp/wallet/create
 * Generates a new XRPL wallet for project escrow
 *
 * SECURITY: Wallet seeds are encrypted and stored server-side.
 * Seeds are NEVER returned to the client to prevent exposure.
 */

import type { APIRoute } from 'astro';
import { getXRPLService } from '../../../../lib/services/xrp-service';
import { checkRBAC } from '../../../../lib/middleware/rbac';
import { db } from '../../../../lib/db';
import { xrpWallets } from '../../../../lib/db/xrp-schema';
import { encryptToken, isEncryptionConfigured } from '../../../../lib/auth/encryption';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const { projectId, purpose = 'project-escrow', fundTestnet = false } = body;

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project ID is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Require encryption to be configured before creating wallets
    if (!isEncryptionConfigured()) {
      console.error('[XRPL API] ENCRYPTION_KEY not configured - refusing to create wallet');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server encryption not configured. Contact administrator.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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

    // SECURITY: Encrypt the seed before storing
    const encryptedSeed = encryptToken(walletInfo.seed!);

    // Store wallet in database with encrypted seed
    const [newWallet] = await db
      .insert(xrpWallets)
      .values({
        projectId: parseInt(projectId),
        address: walletInfo.address,
        publicKey: walletInfo.publicKey,
        encryptedSeed: encryptedSeed,
        purpose: purpose,
        role: context.locals.user?.role || 'gc',
        network: xrplService.getCurrentNetwork().includes('testnet') ? 'testnet' : 'mainnet',
        isActive: true,
      })
      .returning();

    // Fund testnet wallet if requested
    let balance = '0';
    if (fundTestnet) {
      console.log(`[XRPL API] Funding testnet wallet ${walletInfo.address}...`);
      const fundResult = await xrplService.fundTestnetWallet(walletInfo.address);
      if (fundResult.success && fundResult.balance) {
        balance = fundResult.balance;
      }
    }

    // SECURITY: Never return the seed to the client
    // The seed is stored encrypted server-side and retrieved when needed for transactions
    return new Response(
      JSON.stringify({
        success: true,
        wallet: {
          id: newWallet.id,
          address: walletInfo.address,
          publicKey: walletInfo.publicKey,
          balance,
          purpose: purpose,
        },
        network: xrplService.getCurrentNetwork(),
        message: 'Wallet created and securely stored. Use wallet ID for future transactions.',
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
