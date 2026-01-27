/**
 * API: Get XRPL Wallet Balance
 * GET /api/xrp/wallet/balance?address=rXXXXXXXXXX
 */

import type { APIRoute } from 'astro';
import { getXRPLService } from '../../../../lib/services/xrp-service';
import { requireAuth } from '../../../../lib/api/error-handler';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // SECURITY: Require authentication for wallet operations
    requireAuth(context);

    const { url } = context;
    const address = url.searchParams.get('address');

    if (!address) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Wallet address is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const xrplService = getXRPLService();
    const balance = await xrplService.getAccountBalance(address);

    return new Response(
      JSON.stringify({
        success: true,
        balance,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[XRPL API] Balance check failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to get balance',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
