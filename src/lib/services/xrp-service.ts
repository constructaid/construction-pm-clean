/**
 * XRP Ledger Service
 * Handles XRPL connections, wallet management, and transaction processing
 * for blockchain-based construction payment automation
 */

import { Client, Wallet, Payment, AccountInfoRequest, xrpToDrops, dropsToXrp } from 'xrpl';

// XRPL Network Configuration
const XRPL_NETWORKS = {
  testnet: 'wss://s.altnet.rippletest.net:51233',
  devnet: 'wss://s.devnet.rippletest.net:51233',
  mainnet: 'wss://s1.ripple.com', // Production - use with caution
};

// Use testnet by default for development
const CURRENT_NETWORK = XRPL_NETWORKS.testnet;

interface WalletInfo {
  address: string;
  seed?: string; // Only returned on creation, never stored
  publicKey: string;
}

interface PaymentRequest {
  fromWallet: Wallet;
  toAddress: string;
  amount: string; // In XRP
  memo?: string;
  tag?: number;
}

interface PaymentResult {
  success: boolean;
  hash?: string;
  validated?: boolean;
  error?: string;
  fee?: string;
  timestamp?: string;
}

interface AccountBalance {
  address: string;
  xrpBalance: string;
  balanceInDrops: string;
}

/**
 * XRP Ledger Service Class
 * Provides blockchain payment infrastructure for ConstructAid
 */
export class XRPLService {
  private client: Client;
  private connected: boolean = false;

  constructor() {
    this.client = new Client(CURRENT_NETWORK);
  }

  /**
   * Connect to XRPL network
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      await this.client.connect();
      this.connected = true;
      console.log(`[XRPL] Connected to ${CURRENT_NETWORK}`);
    } catch (error) {
      console.error('[XRPL] Connection failed:', error);
      throw new Error('Failed to connect to XRP Ledger');
    }
  }

  /**
   * Disconnect from XRPL network
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.client.disconnect();
      this.connected = false;
      console.log('[XRPL] Disconnected');
    } catch (error) {
      console.error('[XRPL] Disconnect failed:', error);
    }
  }

  /**
   * Generate a new XRPL wallet for project escrow
   * WARNING: In production, store seed in encrypted vault, never in database
   */
  generateWallet(): WalletInfo {
    const wallet = Wallet.generate();

    return {
      address: wallet.address,
      seed: wallet.seed, // CRITICAL: Secure this immediately
      publicKey: wallet.publicKey,
    };
  }

  /**
   * Create wallet from existing seed (for recovery)
   */
  walletFromSeed(seed: string): Wallet {
    return Wallet.fromSeed(seed);
  }

  /**
   * Fund a testnet wallet with free XRP from faucet
   * Only works on testnet/devnet
   */
  async fundTestnetWallet(address: string): Promise<{ success: boolean; balance?: string }> {
    try {
      await this.connect();

      // Use XRPL testnet faucet
      const faucetUrl = 'https://faucet.altnet.rippletest.net/accounts';
      const response = await fetch(faucetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: address }),
      });

      if (!response.ok) {
        throw new Error('Faucet request failed');
      }

      const data = await response.json();

      // Wait a moment for ledger update
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Check balance
      const balance = await this.getAccountBalance(address);

      return {
        success: true,
        balance: balance.xrpBalance,
      };
    } catch (error) {
      console.error('[XRPL] Testnet funding failed:', error);
      return { success: false };
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address: string): Promise<AccountBalance> {
    await this.connect();

    try {
      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated',
      });

      const balanceDrops = response.result.account_data.Balance;
      const xrpBalance = dropsToXrp(balanceDrops);

      return {
        address,
        xrpBalance,
        balanceInDrops: balanceDrops,
      };
    } catch (error: any) {
      if (error.data?.error === 'actNotFound') {
        return {
          address,
          xrpBalance: '0',
          balanceInDrops: '0',
        };
      }
      throw error;
    }
  }

  /**
   * Send XRP payment
   */
  async sendPayment(request: PaymentRequest): Promise<PaymentResult> {
    await this.connect();

    try {
      // Prepare payment transaction
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: request.fromWallet.address,
        Destination: request.toAddress,
        Amount: xrpToDrops(request.amount),
      };

      // Add memo if provided (e.g., "Payment for Milestone: Foundation Complete")
      if (request.memo) {
        payment.Memos = [
          {
            Memo: {
              MemoData: Buffer.from(request.memo, 'utf8').toString('hex'),
              MemoType: Buffer.from('construction-payment', 'utf8').toString('hex'),
            },
          },
        ];
      }

      // Add destination tag if provided
      if (request.tag) {
        payment.DestinationTag = request.tag;
      }

      // Submit and wait for validation
      const response = await this.client.submitAndWait(payment, {
        wallet: request.fromWallet,
      });

      const result = response.result;

      return {
        success: result.meta && typeof result.meta === 'object' && result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.hash,
        validated: result.validated,
        fee: result.Fee ? dropsToXrp(result.Fee) : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[XRPL] Payment failed:', error);
      return {
        success: false,
        error: error.message || 'Payment transaction failed',
      };
    }
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(address: string, limit: number = 20): Promise<any[]> {
    await this.connect();

    try {
      const response = await this.client.request({
        command: 'account_tx',
        account: address,
        limit,
        ledger_index_min: -1,
        ledger_index_max: -1,
      });

      return response.result.transactions || [];
    } catch (error) {
      console.error('[XRPL] Failed to fetch transaction history:', error);
      return [];
    }
  }

  /**
   * Verify transaction by hash
   */
  async verifyTransaction(hash: string): Promise<{ verified: boolean; details?: any }> {
    await this.connect();

    try {
      const response = await this.client.request({
        command: 'tx',
        transaction: hash,
      });

      return {
        verified: response.result.validated === true,
        details: response.result,
      };
    } catch (error) {
      console.error('[XRPL] Transaction verification failed:', error);
      return { verified: false };
    }
  }

  /**
   * Create escrow for milestone-based payments
   * Funds are locked until conditions are met (e.g., time-based release)
   */
  async createEscrow(params: {
    fromWallet: Wallet;
    toAddress: string;
    amount: string;
    finishAfter?: number; // Unix timestamp
    cancelAfter?: number; // Unix timestamp
    memo?: string;
  }): Promise<PaymentResult> {
    await this.connect();

    try {
      // Convert timestamps to Ripple epoch (January 1, 2000 00:00 UTC)
      const RIPPLE_EPOCH = 946684800;

      const escrowCreate: any = {
        TransactionType: 'EscrowCreate',
        Account: params.fromWallet.address,
        Destination: params.toAddress,
        Amount: xrpToDrops(params.amount),
      };

      if (params.finishAfter) {
        escrowCreate.FinishAfter = params.finishAfter - RIPPLE_EPOCH;
      }

      if (params.cancelAfter) {
        escrowCreate.CancelAfter = params.cancelAfter - RIPPLE_EPOCH;
      }

      if (params.memo) {
        escrowCreate.Memos = [
          {
            Memo: {
              MemoData: Buffer.from(params.memo, 'utf8').toString('hex'),
              MemoType: Buffer.from('construction-escrow', 'utf8').toString('hex'),
            },
          },
        ];
      }

      const response = await this.client.submitAndWait(escrowCreate, {
        wallet: params.fromWallet,
      });

      const result = response.result;

      return {
        success: result.meta && typeof result.meta === 'object' && result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.hash,
        validated: result.validated,
        fee: result.Fee ? dropsToXrp(result.Fee) : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[XRPL] Escrow creation failed:', error);
      return {
        success: false,
        error: error.message || 'Escrow creation failed',
      };
    }
  }

  /**
   * Get current network info
   */
  getCurrentNetwork(): string {
    return CURRENT_NETWORK;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
let xrplServiceInstance: XRPLService | null = null;

export function getXRPLService(): XRPLService {
  if (!xrplServiceInstance) {
    xrplServiceInstance = new XRPLService();
  }
  return xrplServiceInstance;
}
