/**
 * XRP Payment Manager Component
 * Handles blockchain payment operations for construction projects
 */

import { createSignal, onMount, Show, For } from 'solid-js';

interface XRPPaymentManagerProps {
  projectId: number;
}

interface Wallet {
  address: string;
  balance: string;
  publicKey: string;
}

interface Transaction {
  hash: string;
  type: string;
  account: string;
  destination?: string;
  amount: string;
  date: number;
  validated: boolean;
}

export default function XRPPaymentManager(props: XRPPaymentManagerProps) {
  const [wallet, setWallet] = createSignal<Wallet | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [creating, setCreating] = createSignal(false);
  const [transactions, setTransactions] = createSignal<Transaction[]>([]);
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');

  // Payment form
  const [toAddress, setToAddress] = createSignal('');
  const [amount, setAmount] = createSignal('');
  const [memo, setMemo] = createSignal('');
  const [walletSeed, setWalletSeed] = createSignal(''); // Stored in memory only

  onMount(async () => {
    // Check if project has existing wallet in localStorage (dev only)
    const savedWallet = localStorage.getItem(`xrp_wallet_${props.projectId}`);
    if (savedWallet) {
      const walletData = JSON.parse(savedWallet);
      setWallet(walletData);
      await loadBalance(walletData.address);
      await loadTransactions(walletData.address);
    }
  });

  const loadBalance = async (address: string) => {
    try {
      const response = await fetch(`/api/xrp/wallet/balance?address=${address}`);
      const data = await response.json();

      if (data.success) {
        setWallet((prev) => prev ? { ...prev, balance: data.balance.xrpBalance } : null);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const loadTransactions = async (address: string) => {
    try {
      const response = await fetch(`/api/xrp/payment/history?address=${address}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const createWallet = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/xrp/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: props.projectId,
          fundTestnet: true, // Auto-fund with testnet XRP
        }),
      });

      const data = await response.json();

      if (data.success) {
        const walletInfo = {
          address: data.wallet.address,
          publicKey: data.wallet.publicKey,
          balance: data.wallet.balance,
        };

        setWallet(walletInfo);
        setWalletSeed(data.wallet.seed); // Store in memory

        // Save to localStorage (dev only - in production use secure vault)
        localStorage.setItem(`xrp_wallet_${props.projectId}`, JSON.stringify(walletInfo));
        localStorage.setItem(`xrp_seed_${props.projectId}`, data.wallet.seed);

        setSuccess(`Wallet created! Funded with ${data.wallet.balance} XRP on testnet`);

        // Load transactions
        await loadTransactions(walletInfo.address);
      } else {
        setError(data.error || 'Failed to create wallet');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setCreating(false);
    }
  };

  const sendPayment = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const seed = localStorage.getItem(`xrp_seed_${props.projectId}`);
      if (!seed) {
        throw new Error('Wallet seed not found');
      }

      const response = await fetch('/api/xrp/payment/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSeed: seed,
          toAddress: toAddress(),
          amount: amount(),
          memo: memo(),
          projectId: props.projectId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Payment sent! Hash: ${data.transaction.hash}`);
        setToAddress('');
        setAmount('');
        setMemo('');

        // Reload wallet and transactions
        if (wallet()) {
          await loadBalance(wallet()!.address);
          await loadTransactions(wallet()!.address);
        }
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (rippleTime: number) => {
    // Ripple epoch starts at 946684800 (January 1, 2000)
    const timestamp = (rippleTime + 946684800) * 1000;
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div class="space-y-6">
      {/* Wallet Status */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">XRP Ledger Wallet</h2>

        <Show when={!wallet()}>
          <div class="text-center py-8">
            <p class="text-gray-600 mb-4">No wallet found for this project</p>
            <button
              onClick={createWallet}
              disabled={creating()}
              class="px-6 py-3 bg-ca-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md font-medium"
            >
              {creating() ? 'Creating Wallet...' : 'Create XRPL Wallet'}
            </button>
            <p class="text-xs text-gray-500 mt-2">This will create a testnet wallet and fund it with 1000 XRP</p>
          </div>
        </Show>

        <Show when={wallet()}>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-ca-teal to-blue-500 rounded-lg text-white">
              <div>
                <div class="text-sm opacity-90">Balance</div>
                <div class="text-3xl font-bold">{wallet()!.balance} XRP</div>
              </div>
              <div class="text-right">
                <div class="text-xs opacity-75">Testnet</div>
                <button
                  onClick={() => wallet() && loadBalance(wallet()!.address)}
                  class="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-lg hover:bg-opacity-30 transition-all mt-1"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span class="text-gray-600">Address:</span>
                <div class="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                  {wallet()!.address}
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* Send Payment Form */}
      <Show when={wallet()}>
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Send Payment</h3>

          <form onSubmit={sendPayment} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Destination Address
              </label>
              <input
                type="text"
                value={toAddress()}
                onInput={(e) => setToAddress(e.currentTarget.value)}
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-ca-teal font-mono text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Amount (XRP)
              </label>
              <input
                type="number"
                step="0.000001"
                value={amount()}
                onInput={(e) => setAmount(e.currentTarget.value)}
                placeholder="10.5"
                required
                min="0.000001"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-ca-teal"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Memo (Optional)
              </label>
              <input
                type="text"
                value={memo()}
                onInput={(e) => setMemo(e.currentTarget.value)}
                placeholder="Payment for Foundation Milestone"
                maxLength={100}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-ca-teal"
              />
            </div>

            <button
              type="submit"
              disabled={loading()}
              class="w-full px-6 py-3 bg-ca-orange text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md font-medium"
            >
              {loading() ? 'Sending...' : 'Send Payment'}
            </button>
          </form>
        </div>
      </Show>

      {/* Messages */}
      <Show when={error()}>
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error()}
        </div>
      </Show>

      <Show when={success()}>
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success()}
        </div>
      </Show>

      {/* Transaction History */}
      <Show when={wallet() && transactions().length > 0}>
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>

          <div class="space-y-3">
            <For each={transactions()}>
              {(tx) => (
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {tx.type}
                        </span>
                        <Show when={tx.validated}>
                          <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            ✓ Validated
                          </span>
                        </Show>
                      </div>
                      <div class="text-sm text-gray-600 space-y-1">
                        <div>
                          <span class="font-medium">Hash:</span>{' '}
                          <span class="font-mono text-xs">{tx.hash}</span>
                        </div>
                        <Show when={tx.destination}>
                          <div>
                            <span class="font-medium">To:</span>{' '}
                            <span class="font-mono text-xs">{tx.destination}</span>
                          </div>
                        </Show>
                        <Show when={tx.date}>
                          <div class="text-xs text-gray-500">{formatDate(tx.date)}</div>
                        </Show>
                      </div>
                    </div>
                    <div class="text-right ml-4">
                      <div class="text-lg font-bold text-gray-900">
                        {typeof tx.amount === 'string' ? (parseInt(tx.amount) / 1000000).toFixed(6) : tx.amount} XRP
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
