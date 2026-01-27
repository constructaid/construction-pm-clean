/**
 * Contract Manager Component
 * Manages subcontract agreements, waivers, and contract documents
 *
 * Uses real API data from /api/contracts endpoint
 */

import { createSignal, onMount, Show, For } from 'solid-js';

interface ContractManagerProps {
  projectId: number;
}

interface Contract {
  id: number;
  contractNumber: string;
  subcontractorName: string;
  subcontractorCompany: string;
  subcontractorEmail?: string;
  subcontractorPhone?: string;
  workDescription: string;
  scopeOfWork?: string;
  csiDivisions?: string;
  contractAmount: number;
  retainagePercentage?: number;
  status: string;
  startDate: string | null;
  completionDate: string | null;
  signedDate?: string | null;
  xrpWalletAddress?: string;
  xrpEscrowEnabled?: boolean;
}

interface NewContractForm {
  subcontractorName: string;
  subcontractorCompany: string;
  subcontractorEmail: string;
  subcontractorPhone: string;
  workDescription: string;
  scopeOfWork: string;
  contractAmount: string;
  retainagePercentage: string;
  startDate: string;
  completionDate: string;
  xrpWalletAddress: string;
}

export default function ContractManager(props: ContractManagerProps) {
  const [contracts, setContracts] = createSignal<Contract[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [view, setView] = createSignal<'list' | 'create' | 'detail'>('list');
  const [selectedContract, setSelectedContract] = createSignal<Contract | null>(null);
  const [saving, setSaving] = createSignal(false);

  const emptyForm: NewContractForm = {
    subcontractorName: '',
    subcontractorCompany: '',
    subcontractorEmail: '',
    subcontractorPhone: '',
    workDescription: '',
    scopeOfWork: '',
    contractAmount: '',
    retainagePercentage: '10',
    startDate: '',
    completionDate: '',
    xrpWalletAddress: '',
  };

  const [formData, setFormData] = createSignal<NewContractForm>(emptyForm);

  onMount(() => {
    loadContracts();
  });

  const loadContracts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts?projectId=${props.projectId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch contracts');
      }

      setContracts(data.contracts || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (e: Event) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const form = formData();
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: props.projectId,
          subcontractorName: form.subcontractorName,
          subcontractorCompany: form.subcontractorCompany,
          subcontractorEmail: form.subcontractorEmail || null,
          subcontractorPhone: form.subcontractorPhone || null,
          workDescription: form.workDescription,
          scopeOfWork: form.scopeOfWork || null,
          contractAmount: parseFloat(form.contractAmount),
          retainagePercentage: parseFloat(form.retainagePercentage) || 10,
          startDate: form.startDate || null,
          completionDate: form.completionDate || null,
          xrpWalletAddress: form.xrpWalletAddress || null,
          status: 'draft',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create contract');
      }

      // Reset form and reload
      setFormData(emptyForm);
      setView('list');
      await loadContracts();
    } catch (err) {
      console.error('Error creating contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContract = async (contractId: number) => {
    if (!confirm('Are you sure you want to delete this contract?')) return;

    try {
      const response = await fetch(`/api/contracts?id=${contractId}&projectId=${props.projectId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete contract');
      }

      await loadContracts();
    } catch (err) {
      console.error('Error deleting contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete contract');
    }
  };

  const handleActivateContract = async (contract: Contract) => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contract.id,
          projectId: props.projectId,
          status: 'active',
          signedDate: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to activate contract');
      }

      await loadContracts();
    } catch (err) {
      console.error('Error activating contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to activate contract');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      terminated: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Error Display */}
      <Show when={error()}>
        <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div class="flex items-center">
            <div class="text-red-500 mr-3">⚠️</div>
            <div>
              <p class="text-red-700">{error()}</p>
              <button
                onClick={() => setError(null)}
                class="text-red-600 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Header */}
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Subcontract Agreements</h2>
            <p class="text-sm text-gray-600 mt-1">
              Manage subcontracts, lien waivers, and insurance certificates
            </p>
          </div>
          <Show when={view() === 'list'}>
            <button
              onClick={() => {
                setFormData(emptyForm);
                setView('create');
              }}
              class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all shadow-md font-medium flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              New Subcontract
            </button>
          </Show>
          <Show when={view() !== 'list'}>
            <button
              onClick={() => setView('list')}
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
            >
              ← Back to List
            </button>
          </Show>
        </div>
      </div>

      {/* Create Form */}
      <Show when={view() === 'create'}>
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Create New Subcontract</h3>
          <form onSubmit={handleCreateContract} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Subcontractor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData().subcontractorName}
                  onInput={(e) => setFormData({ ...formData(), subcontractorName: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData().subcontractorCompany}
                  onInput={(e) => setFormData({ ...formData(), subcontractorCompany: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                  placeholder="Smith Construction LLC"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData().subcontractorEmail}
                  onInput={(e) => setFormData({ ...formData(), subcontractorEmail: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                  placeholder="john@smithconstruction.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData().subcontractorPhone}
                  onInput={(e) => setFormData({ ...formData(), subcontractorPhone: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Scope of Work Description *
              </label>
              <input
                type="text"
                required
                value={formData().workDescription}
                onInput={(e) => setFormData({ ...formData(), workDescription: e.currentTarget.value })}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                placeholder="e.g., Foundation and Concrete Work"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Detailed Scope (Optional)
              </label>
              <textarea
                value={formData().scopeOfWork}
                onInput={(e) => setFormData({ ...formData(), scopeOfWork: e.currentTarget.value })}
                rows={3}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                placeholder="Detailed description of work included..."
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Contract Amount *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData().contractAmount}
                  onInput={(e) => setFormData({ ...formData(), contractAmount: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                  placeholder="125000"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Retainage %
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={formData().retainagePercentage}
                  onInput={(e) => setFormData({ ...formData(), retainagePercentage: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  XRP Wallet Address
                </label>
                <input
                  type="text"
                  value={formData().xrpWalletAddress}
                  onInput={(e) => setFormData({ ...formData(), xrpWalletAddress: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                  placeholder="rPEPPER7kfTD9w2..."
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData().startDate}
                  onInput={(e) => setFormData({ ...formData(), startDate: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                <input
                  type="date"
                  value={formData().completionDate}
                  onInput={(e) => setFormData({ ...formData(), completionDate: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ca-teal focus:border-transparent"
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setView('list')}
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving()}
                class="px-6 py-2 bg-ca-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
              >
                {saving() ? 'Creating...' : 'Create Subcontract'}
              </button>
            </div>
          </form>
        </div>
      </Show>

      {/* List View */}
      <Show when={view() === 'list'}>
        {/* Template Options */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button class="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-ca-teal transition-all text-left">
            <div class="text-2xl mb-2">📜</div>
            <div class="font-semibold text-gray-900">Subcontract Agreement</div>
            <div class="text-xs text-gray-600">Full subcontractor packet</div>
          </button>
          <button class="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-ca-orange transition-all text-left">
            <div class="text-2xl mb-2">✍️</div>
            <div class="font-semibold text-gray-900">Lien Waiver</div>
            <div class="text-xs text-gray-600">Conditional/Unconditional</div>
          </button>
          <button class="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all text-left">
            <div class="text-2xl mb-2">🛡️</div>
            <div class="font-semibold text-gray-900">Insurance Cert</div>
            <div class="text-xs text-gray-600">COI verification</div>
          </button>
          <button class="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all text-left">
            <div class="text-2xl mb-2">📋</div>
            <div class="font-semibold text-gray-900">W-9 Form</div>
            <div class="text-xs text-gray-600">Tax information</div>
          </button>
        </div>

        {/* Loading State */}
        <Show when={loading()}>
          <div class="bg-white rounded-lg shadow-md p-12 text-center">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-ca-teal mx-auto mb-4"></div>
            <p class="text-gray-600">Loading contracts...</p>
          </div>
        </Show>

        {/* Contracts List */}
        <Show when={!loading()}>
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract #
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subcontractor
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scope of Work
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract Amount
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    XRPL Wallet
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <Show
                  when={contracts().length > 0}
                  fallback={
                    <tr>
                      <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                          <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p class="text-lg font-medium text-gray-900 mb-1">No subcontracts yet</p>
                          <p class="text-sm text-gray-500 mb-4">Create your first subcontract agreement</p>
                          <button
                            onClick={() => setView('create')}
                            class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all"
                          >
                            Create Subcontract
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                >
                  <For each={contracts()}>
                    {(contract) => (
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contract.contractNumber}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900">{contract.subcontractorName}</div>
                          <div class="text-sm text-gray-500">{contract.subcontractorCompany}</div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="text-sm text-gray-900">{contract.workDescription}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-semibold">
                          {formatCurrency(contract.contractAmount)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <Show
                            when={contract.xrpWalletAddress}
                            fallback={
                              <span class="text-gray-400">Not set</span>
                            }
                          >
                            <div class="flex items-center gap-1">
                              <span class="text-blue-600">⚡</span>
                              <span class="font-mono text-xs text-gray-600">
                                {contract.xrpWalletAddress?.substring(0, 8)}...
                              </span>
                            </div>
                          </Show>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setView('detail');
                            }}
                            class="text-ca-teal hover:text-ca-orange transition-colors"
                          >
                            View
                          </button>
                          <Show when={contract.status === 'draft'}>
                            <button
                              onClick={() => handleActivateContract(contract)}
                              class="text-green-600 hover:text-green-800 transition-colors"
                            >
                              Activate
                            </button>
                          </Show>
                          <button
                            onClick={() => handleDeleteContract(contract.id)}
                            class="text-red-600 hover:text-red-800 transition-colors"
                          >
                            Delete
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
      </Show>

      {/* Detail View */}
      <Show when={view() === 'detail' && selectedContract()}>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="flex items-start justify-between mb-6">
            <div>
              <h3 class="text-2xl font-bold text-gray-900">{selectedContract()!.contractNumber}</h3>
              <span class={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedContract()!.status)}`}>
                {selectedContract()!.status}
              </span>
            </div>
            <Show when={selectedContract()!.xrpWalletAddress}>
              <div class="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
                <span class="text-2xl">⚡</span>
                <div>
                  <div class="text-xs text-purple-600">XRP Wallet</div>
                  <div class="font-mono text-sm">{selectedContract()!.xrpWalletAddress}</div>
                </div>
              </div>
            </Show>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 class="font-semibold text-gray-700 mb-2">Subcontractor</h4>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="font-medium text-gray-900">{selectedContract()!.subcontractorName}</div>
                <div class="text-gray-600">{selectedContract()!.subcontractorCompany}</div>
                <Show when={selectedContract()!.subcontractorEmail}>
                  <div class="text-sm text-gray-500 mt-2">{selectedContract()!.subcontractorEmail}</div>
                </Show>
                <Show when={selectedContract()!.subcontractorPhone}>
                  <div class="text-sm text-gray-500">{selectedContract()!.subcontractorPhone}</div>
                </Show>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-gray-700 mb-2">Contract Details</h4>
              <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">Contract Amount:</span>
                  <span class="font-bold text-gray-900">{formatCurrency(selectedContract()!.contractAmount)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Retainage:</span>
                  <span class="text-gray-900">{selectedContract()!.retainagePercentage || 10}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Start Date:</span>
                  <span class="text-gray-900">{formatDate(selectedContract()!.startDate)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Completion:</span>
                  <span class="text-gray-900">{formatDate(selectedContract()!.completionDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h4 class="font-semibold text-gray-700 mb-2">Scope of Work</h4>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="font-medium text-gray-900 mb-2">{selectedContract()!.workDescription}</div>
              <Show when={selectedContract()!.scopeOfWork}>
                <div class="text-sm text-gray-600">{selectedContract()!.scopeOfWork}</div>
              </Show>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setView('list')}
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to List
            </button>
            <Show when={selectedContract()!.status === 'draft'}>
              <button
                onClick={() => handleActivateContract(selectedContract()!)}
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Activate Contract
              </button>
            </Show>
          </div>
        </div>
      </Show>

      {/* Info Box */}
      <Show when={view() === 'list'}>
        <div class="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div class="flex items-start gap-4">
            <div class="text-3xl">📋</div>
            <div>
              <h3 class="font-bold text-blue-900 mb-2">Subcontractor Packet Includes:</h3>
              <ul class="text-sm text-blue-800 space-y-1">
                <li>• Subcontract Agreement (customizable template)</li>
                <li>• Conditional Waiver and Release on Progress Payment</li>
                <li>• Unconditional Waiver on Progress Payment</li>
                <li>• Conditional Waiver and Release on Final Payment</li>
                <li>• Unconditional Waiver on Final Payment</li>
                <li>• Contractor Warranty Letter</li>
                <li>• W-9 IRS Form</li>
                <li>• Insurance Certificate Requirements (COI)</li>
              </ul>
              <div class="mt-3 p-3 bg-white rounded-lg border border-blue-300">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-2xl">⚡</span>
                  <div>
                    <div class="font-semibold text-gray-900">XRP Ledger Integration</div>
                    <div class="text-xs text-gray-600">Link subcontractor XRPL wallet for instant payments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
