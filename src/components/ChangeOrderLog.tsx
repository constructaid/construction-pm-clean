/**
 * Change Order Log Component
 * Displays submittal-style log of all Change Orders for a project
 */
import { createSignal, onMount, Show, For } from 'solid-js';

interface ChangeOrder {
  id: number;
  projectId: number;
  changeOrderNumber: string;
  title: string;
  description: string;
  reason: string;
  costImpact: number;
  originalCost: number;
  revisedCost: number;
  scheduleImpactDays: number;
  status: 'proposed' | 'approved' | 'rejected' | 'executed';
  initiatedBy: number;
  initiatedByName?: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChangeOrderLogProps {
  projectId: number;
  projectName?: string;
  onCreateNew: () => void;
}

export default function ChangeOrderLog(props: ChangeOrderLogProps) {
  const [changeOrders, setChangeOrders] = createSignal<ChangeOrder[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [filterStatus, setFilterStatus] = createSignal<string>('all');
  const [searchQuery, setSearchQuery] = createSignal('');

  onMount(async () => {
    await loadChangeOrders();
  });

  const loadChangeOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/change-orders?projectId=${props.projectId}`);
      if (!response.ok) throw new Error('Failed to load change orders');
      const data = await response.json();
      setChangeOrders(data.changeOrders || []);
    } catch (err) {
      setError('Failed to load change order log');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChangeOrders = () => {
    let filtered = changeOrders();

    if (filterStatus() !== 'all') {
      filtered = filtered.filter(co => co.status === filterStatus());
    }

    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter(co =>
        co.changeOrderNumber.toLowerCase().includes(query) ||
        co.title.toLowerCase().includes(query) ||
        co.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      proposed: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      executed: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (cents: number) => {
    const isNegative = cents < 0;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(cents) / 100);
    return isNegative ? `(${formatted})` : formatted;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatistics = () => {
    const all = changeOrders();
    const totalCostImpact = all.reduce((sum, co) => sum + co.costImpact, 0);
    return {
      total: all.length,
      proposed: all.filter(co => co.status === 'proposed').length,
      approved: all.filter(co => co.status === 'approved').length,
      executed: all.filter(co => co.status === 'executed').length,
      rejected: all.filter(co => co.status === 'rejected').length,
      totalCostImpact,
    };
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Change Order Log</h1>
            <p class="text-sm text-gray-600 mt-1">
              {props.projectName || `Project ${props.projectId}`} - Change Order Tracking Log
            </p>
          </div>
          <button
            onClick={props.onCreateNew}
            class="mt-4 md:mt-0 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Change Order
          </button>
        </div>

        {/* Statistics */}
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div class="bg-gray-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-gray-900">{getStatistics().total}</p>
            <p class="text-xs text-gray-600 mt-1">Total COs</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-yellow-700">{getStatistics().proposed}</p>
            <p class="text-xs text-gray-600 mt-1">Proposed</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-green-700">{getStatistics().approved}</p>
            <p class="text-xs text-gray-600 mt-1">Approved</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-blue-700">{getStatistics().executed}</p>
            <p class="text-xs text-gray-600 mt-1">Executed</p>
          </div>
          <div class="bg-red-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-red-700">{getStatistics().rejected}</p>
            <p class="text-xs text-gray-600 mt-1">Rejected</p>
          </div>
          <div class="bg-orange-50 rounded-lg p-4 text-center col-span-2 md:col-span-1">
            <p class={`text-xl font-bold ${getStatistics().totalCostImpact >= 0 ? 'text-orange-700' : 'text-green-700'}`}>
              {formatCurrency(getStatistics().totalCostImpact)}
            </p>
            <p class="text-xs text-gray-600 mt-1">Total Impact</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Search Change Orders
            </label>
            <input
              type="text"
              placeholder="Search by CO#, title, or description..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus()}
              onChange={(e) => setFilterStatus(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="proposed">Proposed</option>
              <option value="approved">Approved</option>
              <option value="executed">Executed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      <Show when={isLoading()}>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p class="text-gray-600 mt-2">Loading change order log...</p>
        </div>
      </Show>

      {/* Error State */}
      <Show when={error()}>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{error()}</p>
        </div>
      </Show>

      {/* Change Order Log Table */}
      <Show when={!isLoading() && !error()}>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CO #
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title / Description
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Impact
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule Impact (Days)
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initiated By
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved Date
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <Show
                  when={filteredChangeOrders().length > 0}
                  fallback={
                    <tr>
                      <td colspan="9" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                          <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p class="text-lg font-medium text-gray-900 mb-1">
                            No change orders found
                          </p>
                          <p class="text-sm text-gray-500 mb-4">
                            {searchQuery() || filterStatus() !== 'all'
                              ? 'Try adjusting your filters'
                              : 'Get started by creating your first change order'}
                          </p>
                          <Show when={!searchQuery() && filterStatus() === 'all'}>
                            <button
                              onClick={props.onCreateNew}
                              class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
                            >
                              Create First Change Order
                            </button>
                          </Show>
                        </div>
                      </td>
                    </tr>
                  }
                >
                  <For each={filteredChangeOrders()}>
                    {(co) => (
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {co.changeOrderNumber}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div class="font-medium">{co.title}</div>
                          <div class="text-gray-500 text-xs mt-1 truncate">
                            {co.description}
                          </div>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(co.status)}`}>
                            {co.status}
                          </span>
                        </td>
                        <td class={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${co.costImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(co.costImpact)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                          {co.scheduleImpactDays > 0 ? `+${co.scheduleImpactDays}` : co.scheduleImpactDays || '0'}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {co.initiatedByName || `User ${co.initiatedBy}`}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(co.createdAt)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(co.approvedAt)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => window.location.href = `/projects/${props.projectId}/change-orders/${co.id}`}
                            class="text-orange-600 hover:text-orange-800 font-medium"
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
        </div>

        {/* Summary Footer */}
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4">
          <p class="text-sm text-gray-600">
            Showing <span class="font-semibold text-gray-900">{filteredChangeOrders().length}</span> of{' '}
            <span class="font-semibold text-gray-900">{changeOrders().length}</span> total change orders
          </p>
        </div>
      </Show>
    </div>
  );
}
