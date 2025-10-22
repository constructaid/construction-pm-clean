/**
 * Payment Application Manager - Combines G702 and G703
 * Manages the full payment application workflow
 */
import { createSignal, Show, For, onMount, createEffect } from 'solid-js';
import PaymentApplicationG702 from './PaymentApplicationG702';
import PaymentApplicationG703 from './PaymentApplicationG703';

interface PaymentApplicationManagerProps {
  projectId: number;
}

export default function PaymentApplicationManager(props: PaymentApplicationManagerProps) {
  const [paymentApplications, setPaymentApplications] = createSignal<any[]>([]);
  const [selectedPayApp, setSelectedPayApp] = createSignal<any | null>(null);
  const [lineItems, setLineItems] = createSignal<any[]>([]);
  const [view, setView] = createSignal<'list' | 'create' | 'detail'>('list');
  const [activeTab, setActiveTab] = createSignal<'g702' | 'g703'>('g702');
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

  return (
    <div>
      {/* List View */}
      <Show when={view() === 'list'}>
        <div>
          {/* Header with Create Button */}
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">All Payment Applications</h2>
              <p class="text-sm text-gray-600 mt-1">
                {paymentApplications().length} application(s)
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Payment Application
            </button>
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

          {/* Payment Applications Table */}
          <Show when={!isLoading() && !error()}>
            <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application #
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Sum
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <Show
                    when={paymentApplications().length > 0}
                    fallback={
                      <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                          <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p class="text-lg font-medium text-gray-900 mb-1">
                              No payment applications yet
                            </p>
                            <p class="text-sm text-gray-500 mb-4">
                              Get started by creating your first payment application
                            </p>
                            <button
                              onClick={handleCreateNew}
                              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                              Create Payment Application
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  >
                    <For each={paymentApplications()}>
                      {(payApp) => (
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{payApp.applicationNumber}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(payApp.periodTo)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payApp.status)}`}>
                              {payApp.status}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(payApp.currentPaymentDue)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatCurrency(payApp.contractSumToDate)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                            <button
                              onClick={() => loadPaymentApplicationDetail(payApp.id)}
                              class="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>
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
                G702 - Application for Payment
              </button>
              <button
                onClick={() => setActiveTab('g703')}
                class={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab() === 'g703'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                G703 - Continuation Sheet
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
        </div>
      </Show>
    </div>
  );
}
