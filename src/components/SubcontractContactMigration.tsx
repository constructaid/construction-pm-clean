/**
 * Subcontract Contact Migration Component
 * Migrate contact information from existing subcontract agreements
 */

import { createSignal, For, Show } from 'solid-js';
import type { Component } from 'solid-js';

interface MigrationProps {
  projectId?: number;
  onComplete?: () => void;
}

const SubcontractContactMigration: Component<MigrationProps> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [preview, setPreview] = createSignal<any>(null);
  const [results, setResults] = createSignal<any>(null);
  const [showPreview, setShowPreview] = createSignal(false);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const url = props.projectId
        ? `/api/contacts/migrate-from-subcontracts?projectId=${props.projectId}`
        : '/api/contacts/migrate-from-subcontracts';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load preview');

      const data = await response.json();
      setPreview(data);
      setShowPreview(true);
    } catch (err: any) {
      alert('Failed to load preview: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const performMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contacts/migrate-from-subcontracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: props.projectId,
          updateExisting: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to migrate contacts');

      const data = await response.json();
      setResults(data.results);

      // Call onComplete callback if provided
      if (props.onComplete) {
        props.onComplete();
      }
    } catch (err: any) {
      alert('Migration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 mb-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl">
          📋
        </div>

        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            Import Contacts from Subcontract Agreements
          </h3>
          <p class="text-gray-700 mb-4">
            Extract contact information from existing subcontract agreements and automatically populate the contacts database with company details, addresses, phone numbers, and CSI divisions.
          </p>

          <Show when={!showPreview() && !results()}>
            <button
              onClick={loadPreview}
              disabled={loading()}
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium shadow-md transition"
            >
              {loading() ? 'Loading Preview...' : '🔍 Preview Subcontracts'}
            </button>
          </Show>

          <Show when={showPreview() && preview() && !results()}>
            <div class="bg-white rounded-lg border border-blue-200 p-4 mb-4">
              <h4 class="font-semibold text-gray-900 mb-3">
                Preview: {preview().total} Subcontract{preview().total !== 1 ? 's' : ''} Found
              </h4>

              <div class="max-h-96 overflow-y-auto">
                <table class="min-w-full text-sm">
                  <thead class="bg-gray-50 sticky top-0">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contract #</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Divisions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <For each={preview().preview}>
                      {(sub) => (
                        <tr class="hover:bg-gray-50">
                          <td class="px-3 py-2 whitespace-nowrap text-gray-900">{sub.contractNumber}</td>
                          <td class="px-3 py-2">
                            <div class="font-medium text-gray-900">{sub.company}</div>
                            <div class="text-xs text-gray-500">{sub.email || '-'}</div>
                          </td>
                          <td class="px-3 py-2 text-gray-900">{sub.name || '-'}</td>
                          <td class="px-3 py-2 text-gray-900">{sub.phone || '-'}</td>
                          <td class="px-3 py-2">
                            <div class="flex flex-wrap gap-1">
                              <For each={sub.csiDivisions || []}>
                                {(div) => (
                                  <span class="inline-flex px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                    {div}
                                  </span>
                                )}
                              </For>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                onClick={performMigration}
                disabled={loading()}
                class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium shadow-md transition"
              >
                {loading() ? 'Migrating...' : '✓ Import All Contacts'}
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreview(null);
                }}
                class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </Show>

          <Show when={results()}>
            <div class="bg-white rounded-lg border border-green-200 p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 class="text-xl font-bold text-green-900">Migration Complete!</h4>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="bg-blue-50 rounded-lg p-3">
                  <div class="text-2xl font-bold text-blue-900">{results().subcontractsProcessed}</div>
                  <div class="text-sm text-blue-700">Subcontracts Processed</div>
                </div>
                <div class="bg-green-50 rounded-lg p-3">
                  <div class="text-2xl font-bold text-green-900">{results().contactsCreated}</div>
                  <div class="text-sm text-green-700">Contacts Created</div>
                </div>
                <div class="bg-yellow-50 rounded-lg p-3">
                  <div class="text-2xl font-bold text-yellow-900">{results().contactsUpdated}</div>
                  <div class="text-sm text-yellow-700">Contacts Updated</div>
                </div>
                <div class="bg-purple-50 rounded-lg p-3">
                  <div class="text-2xl font-bold text-purple-900">{results().divisionsLinked}</div>
                  <div class="text-sm text-purple-700">Divisions Linked</div>
                </div>
              </div>

              <Show when={results().contactsSkipped > 0}>
                <div class="bg-gray-50 rounded p-3 mb-3">
                  <div class="text-sm text-gray-700">
                    <strong>{results().contactsSkipped}</strong> contacts skipped (already exist)
                  </div>
                </div>
              </Show>

              <Show when={results().errors && results().errors.length > 0}>
                <div class="bg-red-50 border border-red-200 rounded p-3 mb-3">
                  <div class="font-semibold text-red-900 mb-2">
                    {results().errors.length} Error{results().errors.length !== 1 ? 's' : ''} Occurred:
                  </div>
                  <div class="max-h-40 overflow-y-auto space-y-1">
                    <For each={results().errors}>
                      {(error) => (
                        <div class="text-sm text-red-700">
                          Subcontract #{error.subcontractId}: {error.error}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              <button
                onClick={() => {
                  setResults(null);
                  setShowPreview(false);
                  setPreview(null);
                }}
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Close
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default SubcontractContactMigration;
