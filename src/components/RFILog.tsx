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
      open: 'bg-blue-900 text-blue-300',
      pending: 'bg-yellow-900 text-yellow-300',
      answered: 'bg-green-900 text-green-300',
      closed: 'bg-gray-700 text-gray-300',
    };
    return colors[status] || 'bg-gray-700 text-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-400',
      medium: 'text-blue-400',
      high: 'text-orange-400',
      urgent: 'text-red-400',
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
      <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-white">RFI Log</h1>
            <p class="text-sm text-gray-400 mt-1">
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
          <div class="bg-gray-900 rounded-lg p-4 text-center border border-gray-700">
            <p class="text-2xl font-bold text-white">{getStatistics().total}</p>
            <p class="text-xs text-gray-400 mt-1">Total RFIs</p>
          </div>
          <div class="bg-blue-900 rounded-lg p-4 text-center border border-blue-800">
            <p class="text-2xl font-bold text-blue-300">{getStatistics().open}</p>
            <p class="text-xs text-gray-400 mt-1">Open</p>
          </div>
          <div class="bg-yellow-900 rounded-lg p-4 text-center border border-yellow-800">
            <p class="text-2xl font-bold text-yellow-300">{getStatistics().pending}</p>
            <p class="text-xs text-gray-400 mt-1">Pending</p>
          </div>
          <div class="bg-green-900 rounded-lg p-4 text-center border border-green-800">
            <p class="text-2xl font-bold text-green-300">{getStatistics().answered}</p>
            <p class="text-xs text-gray-400 mt-1">Answered</p>
          </div>
          <div class="bg-gray-700 rounded-lg p-4 text-center border border-gray-600">
            <p class="text-2xl font-bold text-gray-300">{getStatistics().closed}</p>
            <p class="text-xs text-gray-400 mt-1">Closed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Search RFIs
            </label>
            <input
              type="text"
              placeholder="Search by RFI#, subject, or description..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus()}
              onChange={(e) => setFilterStatus(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p class="text-gray-300 mt-2">Loading RFI log...</p>
        </div>
      </Show>

      {/* Error State */}
      <Show when={error()}>
        <div class="bg-red-900 border border-red-700 rounded-lg p-4">
          <p class="text-red-200">{error()}</p>
        </div>
      </Show>

      {/* RFI Log Table */}
      <Show when={!isLoading() && !error()}>
        <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-700">
              <thead class="bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    RFI #
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date Submitted
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Response Date
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-gray-800 divide-y divide-gray-700">
                <Show
                  when={filteredRfis().length > 0}
                  fallback={
                    <tr>
                      <td colspan="10" class="px-6 py-12 text-center text-gray-400">
                        <div class="flex flex-col items-center">
                          <svg class="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p class="text-lg font-medium text-white mb-1">
                            No RFIs found
                          </p>
                          <p class="text-sm text-gray-400 mb-4">
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
                      <tr class="hover:bg-gray-700">
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {rfi.rfiNumber}
                        </td>
                        <td class="px-4 py-3 text-sm text-white max-w-xs">
                          <div class="font-medium">{rfi.subject}</div>
                          <div class="text-gray-400 text-xs mt-1 truncate">
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
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {rfi.submittedByName || `User ${rfi.submittedBy}`}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {rfi.assignedToName || `User ${rfi.assignedTo}`}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(rfi.createdAt)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(rfi.dueDate)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(rfi.respondedAt)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => window.location.href = `/projects/${props.projectId}/rfis/${rfi.id}`}
                            class="text-blue-400 hover:text-blue-300 font-medium"
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
        <div class="bg-gray-900 rounded-lg border border-gray-700 p-4 mt-4">
          <p class="text-sm text-gray-300">
            Showing <span class="font-semibold text-white">{filteredRfis().length}</span> of{' '}
            <span class="font-semibold text-white">{rfis().length}</span> total RFIs
          </p>
        </div>
      </Show>
    </div>
  );
}
