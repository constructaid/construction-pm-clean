/**
 * API: Get Payment History
 * GET /api/xrp/payment/history?address=rXXXXXXXXXX&limit=20
 * Fetches transaction history for a wallet
 */

import type { APIRoute } from 'astro';
import { getXRPLService } from '../../../../lib/services/xrp-service';
import { requireAuth } from '../../../../lib/api/error-handler';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // SECURITY: Require authentication for payment history
    requireAuth(context);

    const { url } = context;
    const address = url.searchParams.get('address');
    const limit = parseInt(url.searchParams.get('limit') || '20');

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
    const transactions = await xrplService.getTransactionHistory(address, limit);

    // Parse and format transactions
    const formattedTransactions = transactions.map((tx: any) => {
      const txData = tx.tx;
      const meta = tx.meta;

      return {
        hash: txData.hash || txData.Hash,
        type: txData.TransactionType,
        account: txData.Account,
        destination: txData.Destination,
        amount: txData.Amount,
        fee: txData.Fee,
        date: txData.date,
        validated: tx.validated,
        ledgerIndex: tx.ledger_index,
        memos: txData.Memos,
        result: meta?.TransactionResult,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        address,
        count: formattedTransactions.length,
        transactions: formattedTransactions,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[XRPL API] History fetch failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch transaction history',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
