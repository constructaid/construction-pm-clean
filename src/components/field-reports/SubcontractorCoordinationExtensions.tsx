/**
 * Additional render functions for Subcontractor Coordination
 * RFIs, Submittals, Change Orders, Communications, Equipment, Quality
 */

// These functions should be added to the SubcontractorCoordination component

export const renderRFIs = (rfis: any[], subcontractors: any[], selectedSubcontractor: number | null, setSelectedSubcontractor: (id: number | null) => void) => {
  const filteredRFIs = selectedSubcontractor
    ? rfis.filter((rfi) => rfi.assignedTo === selectedSubcontractor || rfi.createdBy === selectedSubcontractor)
    : rfis;

  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-bold text-white">RFI Logs</h3>
        <select
          value={selectedSubcontractor() || ''}
          onInput={(e) => setSelectedSubcontractor(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
          class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        >
          <option value="">All Subcontractors</option>
          <For each={subcontractors()}>
            {(sub) => <option value={sub.id}>{sub.companyName}</option>}
          </For>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-sm text-gray-400 mb-1">Total RFIs</p>
          <p class="text-3xl font-bold text-white">{filteredRFIs.length}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-yellow-500/50">
          <p class="text-sm text-gray-400 mb-1">Open RFIs</p>
          <p class="text-3xl font-bold text-yellow-400">{filteredRFIs.filter((r) => r.status === 'open').length}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-red-500/50">
          <p class="text-sm text-gray-400 mb-1">Overdue</p>
          <p class="text-3xl font-bold text-red-400">
            {filteredRFIs.filter((r) => r.status === 'open' && new Date(r.dueDate) < new Date()).length}
          </p>
        </div>
      </div>

      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <Show when={filteredRFIs.length === 0}>
          <div class="text-center py-12 text-gray-400">
            <p>No RFIs found{selectedSubcontractor() ? ' for this subcontractor' : ''}</p>
          </div>
        </Show>

        <Show when={filteredRFIs.length > 0}>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">RFI #</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subject</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Priority</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Due Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                <For each={filteredRFIs}>
                  {(rfi) => {
                    const isOverdue = rfi.status === 'open' && new Date(rfi.dueDate) < new Date();
                    return (
                      <tr class="hover:bg-gray-700/50 transition">
                        <td class="px-6 py-4 text-white font-medium">{rfi.rfiNumber}</td>
                        <td class="px-6 py-4">
                          <div class="text-white font-medium">{rfi.subject}</div>
                          <div class="text-sm text-gray-400 mt-1">{rfi.description?.substring(0, 60)}...</div>
                        </td>
                        <td class="px-6 py-4">
                          <span class={\`px-2 py-1 rounded text-xs font-medium \${
                            rfi.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                            rfi.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }\`}>
                            {rfi.priority?.toUpperCase()}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <span class={\`px-2 py-1 rounded text-xs font-medium \${
                            rfi.status === 'closed' ? 'bg-green-500/20 text-green-300' :
                            rfi.status === 'in_review' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }\`}>
                            {rfi.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <span class={isOverdue ? 'text-red-400 font-semibold' : 'text-gray-300'}>
                            {new Date(rfi.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <a
                            href={\`/projects/\${props.projectId}/rfis?rfi=\${rfi.id}\`}
                            class="text-ca-teal hover:text-ca-teal/80 text-sm font-medium"
                          >
                            View Details →
                          </a>
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>

      <div class="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
        <div class="flex items-start">
          <svg class="h-6 w-6 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="ml-3">
            <h4 class="text-sm font-semibold text-blue-300">RFI Coordination</h4>
            <p class="text-sm text-blue-200 mt-1">
              Track RFIs related to subcontractor work. Coordinate responses and ensure timely resolution to prevent delays.
              Click "View Details" to see full RFI information and add responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Add similar render functions for:
// - renderSubmittals()
// - renderChangeOrders()
// - renderCommunications()
// - renderEquipment()
// - renderQuality()
