/**
 * Payment Application Manager - Combines G702 and G703
 * Manages the full payment application workflow
 */
import { createSignal, Show, For, onMount, createEffect } from 'solid-js';
import PaymentApplicationG702 from './PaymentApplicationG702';
import PaymentApplicationG703 from './PaymentApplicationG703';
import PaymentApplicationXRPL from './PaymentApplicationXRPL';

interface PaymentApplicationManagerProps {
  projectId: number;
}

export default function PaymentApplicationManager(props: PaymentApplicationManagerProps) {
  const [paymentApplications, setPaymentApplications] = createSignal<any[]>([]);
  const [selectedPayApp, setSelectedPayApp] = createSignal<any | null>(null);
  const [lineItems, setLineItems] = createSignal<any[]>([]);
  const [view, setView] = createSignal<'list' | 'create' | 'detail'>('list');
  const [activeTab, setActiveTab] = createSignal<'g702' | 'g703' | 'xrpl'>('g702');
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    await loadPaymentApplications();
  });

  const loadPaymentApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/payment-applications?projectId=${props.projectId}`);
      if (!response.ok) throw new Error('Failed to load payment applications');
      const data = await response.json();
      setPaymentApplications(data.paymentApplications || []);
    } catch (err) {
      setError('Failed to load payment applications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentApplicationDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payment-applications?id=${id}`);
      if (!response.ok) throw new Error('Failed to load payment application');
      const data = await response.json();
      setSelectedPayApp(data.paymentApplication);
      setLineItems(data.lineItems || []);
      setView('detail');
    } catch (err) {
      setError('Failed to load payment application details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    const nextAppNumber = paymentApplications().length > 0
      ? Math.max(...paymentApplications().map(pa => pa.applicationNumber)) + 1
      : 1;

    setSelectedPayApp({
      projectId: props.projectId,
      applicationNumber: nextAppNumber,
      periodTo: new Date().toISOString().split('T')[0],
      status: 'draft',
      originalContractSum: 0,
      netChangeByChangeOrders: 0,
      totalCompletedAndStored: 0,
      retainagePercentage: 10.00,
      lessPreviousCertificates: 0,
    });
    setLineItems([]);
    setView('create');
    setActiveTab('g702');
  };

  const handleSaveG702 = async (data: any) => {
    try {
      const method = selectedPayApp()?.id ? 'PUT' : 'POST';
      const url = selectedPayApp()?.id
        ? `/api/payment-applications?id=${selectedPayApp().id}`
        : '/api/payment-applications';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          lineItems: lineItems(),
        }),
      });

      if (!response.ok) throw new Error('Failed to save payment application');

      const result = await response.json();
      setSelectedPayApp(result.paymentApplication);
      await loadPaymentApplications();
    } catch (err) {
      console.error('Error saving payment application:', err);
      alert('Failed to save payment application');
    }
  };

  const handleSubmitG702 = async (data: any) => {
    await handleSaveG702(data);
    // Additional submission logic can go here
  };

  const handleUpdateLineItems = (items: any[]) => {
    setLineItems(items);

    // Calculate total from line items and update G702 automatically
    const totalCompleted = items.reduce((sum, item) => sum + item.totalCompletedAndStored, 0);
    if (selectedPayApp()) {
      setSelectedPayApp({
        ...selectedPayApp(),
        totalCompletedAndStored: totalCompleted,
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const calculateTotalBilled = () => {
    return paymentApplications().reduce((sum, app) => sum + (app.currentPaymentDue || 0), 0);
  };

  const getMonthFromPeriod = (periodTo: string) => {
    return new Date(periodTo).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div>
      {/* List View */}
      <Show when={view() === 'list'}>
        <div>
          {/* Hero Section - New Month Billing Application */}
          <div class="bg-gradient-to-r from-ca-teal to-blue-600 rounded-lg shadow-xl p-8 mb-8">
            <div class="flex items-center justify-between">
              <div class="text-white">
                <h1 class="text-3xl font-bold mb-2">Payment Applications (G702/G703)</h1>
                <p class="text-blue-100 text-lg mb-4">
                  Monthly billing applications for {getCurrentMonth()}
                </p>
                <div class="flex items-center gap-6 text-sm">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>{paymentApplications().length} Applications</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{formatCurrency(calculateTotalBilled())} Total Billed</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCreateNew}
                class="px-8 py-4 bg-white text-ca-teal rounded-lg hover:bg-gray-100 transition-all shadow-lg font-bold text-lg flex items-center gap-3"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                New Month Billing Application
              </button>
            </div>
          </div>

          {/* Summary Stats Cards */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <div class="text-sm text-gray-600">Approved</div>
              <div class="text-2xl font-bold text-gray-900">
                {paymentApplications().filter(app => app.status === 'approved').length}
              </div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
              <div class="text-sm text-gray-600">Under Review</div>
              <div class="text-2xl font-bold text-gray-900">
                {paymentApplications().filter(app => app.status === 'under_review').length}
              </div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
              <div class="text-sm text-gray-600">Paid</div>
              <div class="text-2xl font-bold text-gray-900">
                {paymentApplications().filter(app => app.status === 'paid').length}
              </div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-500">
              <div class="text-sm text-gray-600">Draft</div>
              <div class="text-2xl font-bold text-gray-900">
                {paymentApplications().filter(app => app.status === 'draft').length}
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Previous Months Summary</h2>
            <p class="text-sm text-gray-600 mt-1">
              View and manage all payment applications by month
            </p>
          </div>

          {/* Loading State */}
          <Show when={isLoading()}>
            <div class="text-center py-12">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="text-gray-600 mt-2">Loading payment applications...</p>
            </div>
          </Show>

          {/* Error State */}
          <Show when={error()}>
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-800">{error()}</p>
            </div>
          </Show>

          {/* Payment Applications - Monthly Card View */}
          <Show when={!isLoading() && !error()}>
            <Show
              when={paymentApplications().length > 0}
              fallback={
                <div class="bg-white rounded-lg shadow-md p-12 text-center">
                  <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-xl font-semibold text-gray-900 mb-2">
                    No payment applications yet
                  </p>
                  <p class="text-gray-600 mb-6">
                    Get started by creating your first monthly billing application
                  </p>
                  <button
                    onClick={handleCreateNew}
                    class="px-6 py-3 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all shadow-md font-medium inline-flex items-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create First Application
                  </button>
                </div>
              }
            >
              <div class="space-y-4">
                <For each={paymentApplications()}>
                  {(payApp) => (
                    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
                      <div class="p-6">
                        <div class="flex items-center justify-between">
                          {/* Left: Application Info */}
                          <div class="flex-1">
                            <div class="flex items-center gap-4 mb-3">
                              <div class="text-3xl font-bold text-gray-900">
                                #{payApp.applicationNumber}
                              </div>
                              <div>
                                <div class="text-lg font-semibold text-gray-900">
                                  {getMonthFromPeriod(payApp.periodTo)}
                                </div>
                                <div class="text-sm text-gray-500">
                                  Period ending {formatDate(payApp.periodTo)}
                                </div>
                              </div>
                              <span class={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(payApp.status)}`}>
                                {payApp.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>

                            <div class="grid grid-cols-3 gap-6 mt-4">
                              <div>
                                <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Contract Sum to Date</div>
                                <div class="text-lg font-semibold text-gray-900">
                                  {formatCurrency(payApp.contractSumToDate)}
                                </div>
                              </div>
                              <div>
                                <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Work Completed</div>
                                <div class="text-lg font-semibold text-blue-600">
                                  {formatCurrency(payApp.totalCompletedAndStored)}
                                </div>
                              </div>
                              <div>
                                <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Payment Due</div>
                                <div class="text-xl font-bold text-green-600">
                                  {formatCurrency(payApp.currentPaymentDue)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div class="ml-6 flex flex-col gap-3">
                            <button
                              onClick={() => loadPaymentApplicationDetail(payApp.id)}
                              class="px-6 py-3 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all shadow-md font-medium whitespace-nowrap flex items-center gap-2"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                              View Details
                            </button>
                            <Show when={payApp.status === 'approved' && !payApp.xrpTransactionHash}>
                              <button
                                onClick={() => {
                                  setSelectedPayApp(payApp);
                                  setView('detail');
                                  setActiveTab('xrpl');
                                }}
                                class="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all shadow-md font-medium whitespace-nowrap flex items-center gap-2"
                              >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                                Pay via XRPL
                              </button>
                            </Show>
                            <Show when={payApp.xrpTransactionHash}>
                              <div class="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-center">
                                <div class="text-xs text-green-700 font-semibold">PAID VIA BLOCKCHAIN</div>
                                <div class="text-xs text-green-600 font-mono mt-1">
                                  {payApp.xrpTransactionHash?.substring(0, 12)}...
                                </div>
                              </div>
                            </Show>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </div>
      </Show>

      {/* Create/Detail View */}
      <Show when={view() === 'create' || view() === 'detail'}>
        <div>
          {/* Back Button */}
          <button
            onClick={() => {
              setView('list');
              setSelectedPayApp(null);
              setLineItems([]);
            }}
            class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </button>

          {/* Tab Navigation */}
          <div class="mb-6 border-b border-gray-200">
            <nav class="flex gap-8">
              <button
                onClick={() => setActiveTab('g702')}
                class={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab() === 'g702'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📄 G702 - Application for Payment
              </button>
              <button
                onClick={() => setActiveTab('g703')}
                class={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab() === 'g703'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 G703 - Continuation Sheet
              </button>
              <button
                onClick={() => setActiveTab('xrpl')}
                class={`pb-4 px-1 border-b-2 font-medium text-sm transition flex items-center gap-2 ${
                  activeTab() === 'xrpl'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚡ Blockchain Payment (XRPL)
                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">New</span>
              </button>
            </nav>
          </div>

          {/* G702 Tab */}
          <Show when={activeTab() === 'g702'}>
            <PaymentApplicationG702
              paymentApplication={selectedPayApp()}
              projectId={props.projectId}
              onSave={handleSaveG702}
              onSubmit={handleSubmitG702}
              readOnly={selectedPayApp()?.status === 'approved' || selectedPayApp()?.status === 'paid'}
            />
          </Show>

          {/* G703 Tab */}
          <Show when={activeTab() === 'g703'}>
            <PaymentApplicationG703
              lineItems={lineItems()}
              paymentApplicationId={selectedPayApp()?.id}
              projectId={props.projectId}
              onUpdate={handleUpdateLineItems}
              readOnly={selectedPayApp()?.status === 'approved' || selectedPayApp()?.status === 'paid'}
            />
          </Show>

          {/* XRPL Blockchain Payment Tab */}
          <Show when={activeTab() === 'xrpl'}>
            <PaymentApplicationXRPL
              paymentApp={selectedPayApp()}
              projectId={props.projectId}
              onPaymentComplete={async (txHash) => {
                console.log('Payment completed with hash:', txHash);
                // Update payment app status to 'paid'
                if (selectedPayApp()?.id) {
                  await fetch(`/api/payment-applications?id=${selectedPayApp().id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...selectedPayApp(),
                      status: 'paid',
                      xrpTransactionHash: txHash,
                    }),
                  });
                  await loadPaymentApplications();
                }
              }}
            />
          </Show>
        </div>
      </Show>
    </div>
  );
}
