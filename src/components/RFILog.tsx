/**
 * RFI Log Component
 * Displays submittal-style log of all RFIs for a project
 */
import { createSignal, onMount, Show, For } from 'solid-js';

interface RFI {
  id: number;
  projectId: number;
  rfiNumber: string;
  subject: string;
  description: string;
  question: string;
  status: 'open' | 'pending' | 'answered' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedBy: number;
  submittedByName?: string;
  assignedTo: number;
  assignedToName?: string;
  response?: string;
  respondedBy?: number;
  respondedByName?: string;
  respondedAt?: string;
  dueDate?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface RFILogProps {
  projectId: number;
  projectName?: string;
  onCreateNew: () => void;
}

export default function RFILog(props: RFILogProps) {
  const [rfis, setRfis] = createSignal<RFI[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [filterStatus, setFilterStatus] = createSignal<string>('all');
  const [searchQuery, setSearchQuery] = createSignal('');

  onMount(async () => {
    await loadRFIs();
  });

  const loadRFIs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rfis?projectId=${props.projectId}`);
      if (!response.ok) throw new Error('Failed to load RFIs');
      const data = await response.json();
      setRfis(data.rfis || []);
    } catch (err) {
      setError('Failed to load RFI log');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRfis = () => {
    let filtered = rfis();

    // Filter by status
    if (filterStatus() !== 'all') {
      filtered = filtered.filter(rfi => rfi.status === filterStatus());
    }

    // Filter by search query
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter(rfi =>
        rfi.rfiNumber.toLowerCase().includes(query) ||
        rfi.subject.toLowerCase().includes(query) ||
        rfi.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      answered: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
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
    const all = rfis();
    return {
      total: all.length,
      open: all.filter(r => r.status === 'open').length,
      pending: all.filter(r => r.status === 'pending').length,
      answered: all.filter(r => r.status === 'answered').length,
      closed: all.filter(r => r.status === 'closed').length,
    };
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">RFI Log</h1>
            <p class="text-sm text-gray-600 mt-1">
              {props.projectName || `Project ${props.projectId}`} - Request for Information Submittal Log
            </p>
          </div>
          <button
            onClick={props.onCreateNew}
            class="mt-4 md:mt-0 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New RFI
          </button>
        </div>

        {/* Statistics */}
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div class="bg-gray-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-gray-900">{getStatistics().total}</p>
            <p class="text-xs text-gray-600 mt-1">Total RFIs</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-blue-700">{getStatistics().open}</p>
            <p class="text-xs text-gray-600 mt-1">Open</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-yellow-700">{getStatistics().pending}</p>
            <p class="text-xs text-gray-600 mt-1">Pending</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-green-700">{getStatistics().answered}</p>
            <p class="text-xs text-gray-600 mt-1">Answered</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-gray-700">{getStatistics().closed}</p>
            <p class="text-xs text-gray-600 mt-1">Closed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Search RFIs
            </label>
            <input
              type="text"
              placeholder="Search by RFI#, subject, or description..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus()}
              onChange={(e) => setFilterStatus(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      <Show when={isLoading()}>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-gray-600 mt-2">Loading RFI log...</p>
        </div>
      </Show>

      {/* Error State */}
      <Show when={error()}>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{error()}</p>
        </div>
      </Show>

      {/* RFI Log Table */}
      <Show when={!isLoading() && !error()}>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFI #
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Submitted
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Date
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <Show
                  when={filteredRfis().length > 0}
                  fallback={
                    <tr>
                      <td colspan="10" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                          <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p class="text-lg font-medium text-gray-900 mb-1">
                            No RFIs found
                          </p>
                          <p class="text-sm text-gray-500 mb-4">
                            {searchQuery() || filterStatus() !== 'all'
                              ? 'Try adjusting your filters'
                              : 'Get started by creating your first RFI'}
                          </p>
                          <Show when={!searchQuery() && filterStatus() === 'all'}>
                            <button
                              onClick={props.onCreateNew}
                              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                              Create First RFI
                            </button>
                          </Show>
                        </div>
                      </td>
                    </tr>
                  }
                >
                  <For each={filteredRfis()}>
                    {(rfi) => (
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rfi.rfiNumber}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div class="font-medium">{rfi.subject}</div>
                          <div class="text-gray-500 text-xs mt-1 truncate">
                            {rfi.description}
                          </div>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rfi.status)}`}>
                            {rfi.status}
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class={`text-sm font-medium ${getPriorityColor(rfi.priority)}`}>
                            {rfi.priority}
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {rfi.submittedByName || `User ${rfi.submittedBy}`}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {rfi.assignedToName || `User ${rfi.assignedTo}`}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(rfi.createdAt)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(rfi.dueDate)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(rfi.respondedAt)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => window.location.href = `/projects/${props.projectId}/rfis/${rfi.id}`}
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
        </div>

        {/* Summary Footer */}
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4">
          <p class="text-sm text-gray-600">
            Showing <span class="font-semibold text-gray-900">{filteredRfis().length}</span> of{' '}
            <span class="font-semibold text-gray-900">{rfis().length}</span> total RFIs
          </p>
        </div>
      </Show>
    </div>
  );
}
