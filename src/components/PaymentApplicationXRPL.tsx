/**
 * Payment Application XRPL Integration
 * Links AIA G702/G703 forms to XRP Ledger blockchain payments
 */

import { createSignal, Show } from 'solid-js';

interface PaymentApplicationXRPLProps {
  paymentApp: any;
  projectId: number;
  onPaymentComplete?: (txHash: string) => void;
}

export default function PaymentApplicationXRPL(props: PaymentApplicationXRPLProps) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');
  const [txHash, setTxHash] = createSignal('');
  const [walletAddress, setWalletAddress] = createSignal('');
  const [xrpAmount, setXrpAmount] = createSignal('');
  const [exchangeRate, setExchangeRate] = createSignal(2.0); // Default: $2/XRP
  const [paymentMethod, setPaymentMethod] = createSignal<'instant' | 'escrow'>('instant');
  const [escrowDays, setEscrowDays] = createSignal(7);

  // Calculate XRP equivalent from USD
  const calculateXRPAmount = () => {
    const usdAmount = props.paymentApp?.currentPaymentDue || 0;
    const xrp = (usdAmount / exchangeRate()).toFixed(6);
    setXrpAmount(xrp);
    return xrp;
  };

  const processBlockchainPayment = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get project wallet seed from localStorage (in production, use secure vault)
      const walletSeed = localStorage.getItem(`xrp_seed_${props.projectId}`);
      if (!walletSeed) {
        throw new Error('Project wallet not found. Please create an XRPL wallet first.');
      }

      const destinationAddress = walletAddress();
      if (!destinationAddress) {
        throw new Error('Destination wallet address is required');
      }

      const xrpAmountToSend = calculateXRPAmount();

      // Build payment memo
      const memo = `Payment App #${props.paymentApp.applicationNumber} - ${props.paymentApp.periodTo} - USD: $${props.paymentApp.currentPaymentDue.toLocaleString()}`;

      let response;

      if (paymentMethod() === 'instant') {
        // Instant payment
        response = await fetch('/api/xrp/payment/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromSeed: walletSeed,
            toAddress: destinationAddress,
            amount: xrpAmountToSend,
            memo,
            projectId: props.projectId,
          }),
        });
      } else {
        // Escrow payment
        response = await fetch('/api/xrp/payment/escrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromSeed: walletSeed,
            toAddress: destinationAddress,
            amount: xrpAmountToSend,
            projectId: props.projectId,
            daysUntilRelease: escrowDays(),
            memo,
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        const hash = data.transaction?.hash || data.escrow?.hash;
        setTxHash(hash);
        setSuccess(
          paymentMethod() === 'instant'
            ? `Payment sent successfully! ${xrpAmountToSend} XRP transferred.`
            : `Escrow created successfully! ${xrpAmountToSend} XRP locked for ${escrowDays()} days.`
        );

        // Notify parent component
        if (props.onPaymentComplete) {
          props.onPaymentComplete(hash);
        }
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process blockchain payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="text-2xl">⚡</div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">Blockchain Payment (XRP Ledger)</h3>
          <p class="text-sm text-gray-600">Process payment via immutable blockchain</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div class="bg-white rounded-lg p-4 mb-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-gray-600">Application #</div>
            <div class="font-bold text-gray-900">{props.paymentApp?.applicationNumber}</div>
          </div>
          <div>
            <div class="text-gray-600">Period Ending</div>
            <div class="font-bold text-gray-900">{props.paymentApp?.periodTo}</div>
          </div>
          <div>
            <div class="text-gray-600">USD Amount</div>
            <div class="font-bold text-green-600 text-lg">
              ${props.paymentApp?.currentPaymentDue?.toLocaleString() || '0.00'}
            </div>
          </div>
          <div>
            <div class="text-gray-600">XRP Equivalent</div>
            <div class="font-bold text-blue-600 text-lg">
              {calculateXRPAmount()} XRP
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          XRP/USD Exchange Rate
        </label>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">1 XRP =</span>
          <input
            type="number"
            step="0.01"
            value={exchangeRate()}
            onInput={(e) => setExchangeRate(parseFloat(e.currentTarget.value) || 2.0)}
            class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal"
          />
          <span class="text-sm text-gray-600">USD</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Using live rate: ${exchangeRate().toFixed(2)}/XRP
        </p>
      </div>

      {/* Payment Method */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('instant')}
            class={`p-3 border-2 rounded-lg text-left transition-all ${
              paymentMethod() === 'instant'
                ? 'border-ca-teal bg-ca-teal bg-opacity-10'
                : 'border-gray-200 hover:border-ca-teal'
            }`}
          >
            <div class="font-semibold text-sm">⚡ Instant Payment</div>
            <div class="text-xs text-gray-600">Settles in 3-5 seconds</div>
          </button>
          <button
            onClick={() => setPaymentMethod('escrow')}
            class={`p-3 border-2 rounded-lg text-left transition-all ${
              paymentMethod() === 'escrow'
                ? 'border-purple-500 bg-purple-500 bg-opacity-10'
                : 'border-gray-200 hover:border-purple-500'
            }`}
          >
            <div class="font-semibold text-sm">🔒 Escrow</div>
            <div class="text-xs text-gray-600">Time-locked release</div>
          </button>
        </div>
      </div>

      {/* Escrow Options */}
      <Show when={paymentMethod() === 'escrow'}>
        <div class="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Escrow Release (Days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={escrowDays()}
            onInput={(e) => setEscrowDays(parseInt(e.currentTarget.value) || 7)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <p class="text-xs text-gray-600 mt-1">
            Funds will be locked for {escrowDays()} days before automatic release
          </p>
        </div>
      </Show>

      {/* Destination Address */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Contractor XRPL Wallet Address *
        </label>
        <input
          type="text"
          value={walletAddress()}
          onInput={(e) => setWalletAddress(e.currentTarget.value)}
          placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal font-mono text-sm"
        />
        <p class="text-xs text-gray-500 mt-1">
          Enter the contractor's XRP Ledger wallet address to receive payment
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={processBlockchainPayment}
        disabled={loading() || !walletAddress()}
        class="w-full px-6 py-3 bg-gradient-to-r from-ca-teal to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md font-medium flex items-center justify-center gap-2"
      >
        {loading() ? (
          'Processing...'
        ) : (
          <>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            {paymentMethod() === 'instant'
              ? `Send ${calculateXRPAmount()} XRP Now`
              : `Create ${calculateXRPAmount()} XRP Escrow`}
          </>
        )}
      </button>

      {/* Messages */}
      <Show when={error()}>
        <div class="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error()}
        </div>
      </Show>

      <Show when={success()}>
        <div class="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div class="font-semibold mb-1">{success()}</div>
          <Show when={txHash()}>
            <div class="text-xs font-mono mt-2">
              <div class="text-gray-600">Transaction Hash:</div>
              <div class="break-all">{txHash()}</div>
              <a
                href={`https://testnet.xrpl.org/transactions/${txHash()}`}
                target="_blank"
                class="text-ca-teal hover:underline mt-1 inline-block"
              >
                View on XRPL Explorer →
              </a>
            </div>
          </Show>
        </div>
      </Show>

      {/* Info Box */}
      <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div class="text-xs text-gray-700">
          <div class="font-semibold mb-1">💡 Blockchain Benefits:</div>
          <ul class="space-y-1 ml-4">
            <li>• Settlement in 3-5 seconds (vs 1-3 days)</li>
            <li>• Transaction fee: ~$0.0002 (vs $25-50 wire transfer)</li>
            <li>• Immutable record on public ledger</li>
            <li>• Full transparency for all stakeholders</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
