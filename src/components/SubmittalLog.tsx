/**
 * Submittal Log Component
 * Displays submittal-style log of all Submittals for a project
 */
import { createSignal, onMount, Show, For } from 'solid-js';

interface Submittal {
  id: number;
  projectId: number;
  submittalNumber: string;
  csiDivision: string;
  specSection?: string;
  title: string;
  description?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'closed';
  submittedBy: number;
  submittedByName?: string;
  reviewedByGC?: number;
  gcReviewDate?: string;
  reviewedByArchitect?: number;
  architectReviewDate?: string;
  finalStatus?: string;
  approvedBy?: number;
  approvedAt?: string;
  dueDate?: string;
  submittedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubmittalLogProps {
  projectId: number;
  projectName?: string;
  onCreateNew: () => void;
}

export default function SubmittalLog(props: SubmittalLogProps) {
  const [submittals, setSubmittals] = createSignal<Submittal[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [filterStatus, setFilterStatus] = createSignal<string>('all');
  const [filterDivision, setFilterDivision] = createSignal<string>('all');
  const [searchQuery, setSearchQuery] = createSignal('');

  onMount(async () => {
    await loadSubmittals();
  });

  const loadSubmittals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/submittals?projectId=${props.projectId}`);
      if (!response.ok) throw new Error('Failed to load submittals');
      const data = await response.json();
      setSubmittals(data.submittals || []);
    } catch (err) {
      setError('Failed to load submittal log');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubmittals = () => {
    let filtered = submittals();

    if (filterStatus() !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus());
    }

    if (filterDivision() !== 'all') {
      filtered = filtered.filter(s => s.csiDivision === filterDivision());
    }

    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter(s =>
        s.submittalNumber.toLowerCase().includes(query) ||
        s.title.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getUniqueDivisions = () => {
    const divisions = new Set(submittals().map(s => s.csiDivision));
    return Array.from(divisions).sort();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    const all = submittals();
    return {
      total: all.length,
      submitted: all.filter(s => s.status === 'submitted').length,
      under_review: all.filter(s => s.status === 'under_review').length,
      approved: all.filter(s => s.status === 'approved').length,
      rejected: all.filter(s => s.status === 'rejected').length,
    };
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Submittal Log</h1>
            <p class="text-sm text-gray-600 mt-1">
              {props.projectName || `Project ${props.projectId}`} - Product Submittal Log
            </p>
          </div>
          <button
            onClick={props.onCreateNew}
            class="mt-4 md:mt-0 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Submittal
          </button>
        </div>

        {/* Statistics */}
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div class="bg-gray-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-gray-900">{getStatistics().total}</p>
            <p class="text-xs text-gray-600 mt-1">Total Submittals</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-blue-700">{getStatistics().submitted}</p>
            <p class="text-xs text-gray-600 mt-1">Submitted</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-yellow-700">{getStatistics().under_review}</p>
            <p class="text-xs text-gray-600 mt-1">Under Review</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-green-700">{getStatistics().approved}</p>
            <p class="text-xs text-gray-600 mt-1">Approved</p>
          </div>
          <div class="bg-red-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-red-700">{getStatistics().rejected}</p>
            <p class="text-xs text-gray-600 mt-1">Rejected</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Search Submittals
            </label>
            <input
              type="text"
              placeholder="Search by number, title, or description..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus()}
              onChange={(e) => setFilterStatus(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by CSI Division
            </label>
            <select
              value={filterDivision()}
              onChange={(e) => setFilterDivision(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Divisions</option>
              <For each={getUniqueDivisions()}>
                {(division) => <option value={division}>Division {division}</option>}
              </For>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      <Show when={isLoading()}>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p class="text-gray-600 mt-2">Loading submittal log...</p>
        </div>
      </Show>

      {/* Error State */}
      <Show when={error()}>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{error()}</p>
        </div>
      </Show>

      {/* Submittal Log Table */}
      <Show when={!isLoading() && !error()}>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submittal #
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CSI Div
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spec Section
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title / Description
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Submitted
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GC Review
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Architect Review
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <Show
                  when={filteredSubmittals().length > 0}
                  fallback={
                    <tr>
                      <td colspan="10" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                          <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p class="text-lg font-medium text-gray-900 mb-1">
                            No submittals found
                          </p>
                          <p class="text-sm text-gray-500 mb-4">
                            {searchQuery() || filterStatus() !== 'all' || filterDivision() !== 'all'
                              ? 'Try adjusting your filters'
                              : 'Get started by creating your first submittal'}
                          </p>
                          <Show when={!searchQuery() && filterStatus() === 'all' && filterDivision() === 'all'}>
                            <button
                              onClick={props.onCreateNew}
                              class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                            >
                              Create First Submittal
                            </button>
                          </Show>
                        </div>
                      </td>
                    </tr>
                  }
                >
                  <For each={filteredSubmittals()}>
                    {(submittal) => (
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {submittal.submittalNumber}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {submittal.csiDivision}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {submittal.specSection || '—'}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div class="font-medium">{submittal.title}</div>
                          <Show when={submittal.description}>
                            <div class="text-gray-500 text-xs mt-1 truncate">
                              {submittal.description}
                            </div>
                          </Show>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submittal.status)}`}>
                            {submittal.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {submittal.submittedByName || `User ${submittal.submittedBy}`}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(submittal.submittedDate)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(submittal.gcReviewDate)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(submittal.architectReviewDate)}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => window.location.href = `/projects/${props.projectId}/submittals/${submittal.id}`}
                            class="text-purple-600 hover:text-purple-800 font-medium"
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
            Showing <span class="font-semibold text-gray-900">{filteredSubmittals().length}</span> of{' '}
            <span class="font-semibold text-gray-900">{submittals().length}</span> total submittals
          </p>
        </div>
      </Show>
    </div>
  );
}
