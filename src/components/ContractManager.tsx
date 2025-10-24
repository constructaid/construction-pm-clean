/**
 * Contract Manager Component
 * Manages subcontract agreements, waivers, and contract documents
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
  workDescription: string;
  contractAmount: number;
  status: string;
  startDate: string;
  completionDate: string;
  xrpWalletAddress?: string;
}

export default function ContractManager(props: ContractManagerProps) {
  const [contracts, setContracts] = createSignal<Contract[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [view, setView] = createSignal<'list' | 'create' | 'detail'>('list');
  const [selectedContract, setSelectedContract] = createSignal<Contract | null>(null);

  // Mock data for now
  const mockContracts: Contract[] = [
    {
      id: 1,
      contractNumber: 'SC-2025-001',
      subcontractorName: 'John Smith',
      subcontractorCompany: 'Smith Concrete Inc.',
      workDescription: 'Foundation and Concrete Work',
      contractAmount: 125000,
      status: 'active',
      startDate: '2025-01-15',
      completionDate: '2025-03-30',
      xrpWalletAddress: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
    },
    {
      id: 2,
      contractNumber: 'SC-2025-002',
      subcontractorName: 'Jane Doe',
      subcontractorCompany: 'Elite Framing LLC',
      workDescription: 'Framing and Carpentry',
      contractAmount: 95000,
      status: 'active',
      startDate: '2025-02-01',
      completionDate: '2025-04-15',
    },
  ];

  onMount(() => {
    loadContracts();
  });

  const loadContracts = async () => {
    setLoading(true);
    // TODO: Replace with actual API call
    setTimeout(() => {
      setContracts(mockContracts);
      setLoading(false);
    }, 500);
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

  return (
    <div>
      {/* Header */}
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Subcontract Agreements</h2>
            <p class="text-sm text-gray-600 mt-1">
              Manage subcontracts, lien waivers, and insurance certificates
            </p>
          </div>
          <button
            onClick={() => setView('create')}
            class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all shadow-md font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Subcontract
          </button>
        </div>
      </div>

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

      {/* Contracts List */}
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
                      ${contract.contractAmount.toLocaleString()}
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
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          setView('detail');
                        }}
                        class="text-ca-teal hover:text-ca-orange transition-colors"
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

      {/* Info Box */}
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
    </div>
  );
}
