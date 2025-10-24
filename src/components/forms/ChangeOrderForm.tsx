/**
 * Change Order Form Component
 * Creates new Change Orders for the project
 */
import { createSignal } from 'solid-js';

interface ChangeOrderFormProps {
  projectId: string;
  onSuccess?: (changeOrder: any) => void;
  onCancel?: () => void;
}

export default function ChangeOrderForm(props: ChangeOrderFormProps) {
  const [formData, setFormData] = createSignal({
    title: '',
    description: '',
    reason: '',
    baseContractAmount: '',
    clientContingency: '',
    proposedAmount: '',
    approvedAmount: '',
    costImpact: '',
    scheduleImpactDays: '0',
  });

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = formData();

      // Validate required fields
      if (!data.title || !data.description || !data.reason) {
        setError('Title, description, and reason are required');
        setIsSubmitting(false);
        return;
      }

      // Convert all monetary values to cents
      const baseContractAmountCents = data.baseContractAmount
        ? Math.round(parseFloat(data.baseContractAmount) * 100)
        : 0;
      const clientContingencyCents = data.clientContingency
        ? Math.round(parseFloat(data.clientContingency) * 100)
        : 0;
      const proposedAmountCents = data.proposedAmount
        ? Math.round(parseFloat(data.proposedAmount) * 100)
        : 0;
      const approvedAmountCents = data.approvedAmount
        ? Math.round(parseFloat(data.approvedAmount) * 100)
        : 0;
      const costImpactCents = data.costImpact
        ? Math.round(parseFloat(data.costImpact) * 100)
        : 0;

      const response = await fetch('/api/change-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: parseInt(props.projectId),
          title: data.title,
          description: data.description,
          reason: data.reason,
          baseContractAmount: baseContractAmountCents,
          clientContingency: clientContingencyCents,
          contingencyRemaining: clientContingencyCents, // Initially all contingency is remaining
          proposedAmount: proposedAmountCents,
          approvedAmount: approvedAmountCents,
          costImpact: costImpactCents,
          scheduleImpactDays: parseInt(data.scheduleImpactDays) || 0,
          initiatedBy: 1, // Mock user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Change Order');
      }

      const result = await response.json();
      props.onSuccess?.(result.changeOrder);

      // Reset form
      setFormData({
        title: '',
        description: '',
        reason: '',
        baseContractAmount: '',
        clientContingency: '',
        proposedAmount: '',
        approvedAmount: '',
        costImpact: '',
        scheduleImpactDays: '0',
      });
    } catch (err) {
      console.error('Error creating Change Order:', err);
      setError('Failed to create Change Order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-6">Create Change Order</h3>

        {error() && (
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-800">{error()}</p>
          </div>
        )}

        {/* Title */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            required
            value={formData().title}
            onInput={(e) => updateField('title', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Brief title for the change order"
          />
        </div>

        {/* Description */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData().description}
            onInput={(e) => updateField('description', e.currentTarget.value)}
            rows={4}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Detailed description of the changes"
          />
        </div>

        {/* Reason */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Reason for Change *
          </label>
          <textarea
            required
            value={formData().reason}
            onInput={(e) => updateField('reason', e.currentTarget.value)}
            rows={3}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Why is this change necessary?"
          />
        </div>

        {/* Contract Information */}
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 class="font-semibold text-blue-900 mb-3">Contract Information</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-blue-900 mb-2">
                Base Contract Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData().baseContractAmount}
                onInput={(e) => updateField('baseContractAmount', e.currentTarget.value)}
                class="w-full px-4 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p class="mt-1 text-xs text-blue-700">Original project contract value</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-blue-900 mb-2">
                Client Contingency ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData().clientContingency}
                onInput={(e) => updateField('clientContingency', e.currentTarget.value)}
                class="w-full px-4 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p class="mt-1 text-xs text-blue-700">Total contingency budget available</p>
            </div>
          </div>
        </div>

        {/* Change Order Amounts */}
        <div class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 class="font-semibold text-green-900 mb-3">Change Order Amounts</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-green-900 mb-2">
                Proposed Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData().proposedAmount}
                onInput={(e) => updateField('proposedAmount', e.currentTarget.value)}
                class="w-full px-4 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p class="mt-1 text-xs text-green-700">Initial proposed change order amount</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Approved Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData().approvedAmount}
                onInput={(e) => updateField('approvedAmount', e.currentTarget.value)}
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p class="mt-1 text-xs text-gray-500">Final approved amount (leave blank until approved)</p>
            </div>
          </div>
        </div>

        {/* Cost and Schedule Impact */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cost Impact ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData().costImpact}
              onInput={(e) => updateField('costImpact', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0.00"
            />
            <p class="mt-1 text-xs text-gray-500">Enter positive for added costs, negative for savings</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Schedule Impact (Days)
            </label>
            <input
              type="number"
              value={formData().scheduleImpactDays}
              onInput={(e) => updateField('scheduleImpactDays', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0"
            />
            <p class="mt-1 text-xs text-gray-500">Additional days added to schedule</p>
          </div>
        </div>

        {/* Summary Box */}
        <div class="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h4 class="font-medium text-gray-900 mb-3">Change Order Impact Summary</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-600 block mb-1">Base Contract:</span>
              <span class="font-semibold text-gray-900">
                ${formData().baseContractAmount || '0.00'}
              </span>
            </div>
            <div>
              <span class="text-gray-600 block mb-1">Contingency:</span>
              <span class="font-semibold text-gray-900">
                ${formData().clientContingency || '0.00'}
              </span>
            </div>
            <div>
              <span class="text-gray-600 block mb-1">Proposed Amount:</span>
              <span class="font-semibold text-blue-600">
                ${formData().proposedAmount || '0.00'}
              </span>
            </div>
            <div>
              <span class="text-gray-600 block mb-1">Approved Amount:</span>
              <span class="font-semibold text-green-600">
                ${formData().approvedAmount || '0.00'}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-300">
            <div>
              <span class="text-gray-600">Cost Impact:</span>
              <span class={`ml-2 font-semibold ${parseFloat(formData().costImpact || '0') >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${formData().costImpact || '0.00'}
              </span>
            </div>
            <div>
              <span class="text-gray-600">Schedule Impact:</span>
              <span class="ml-2 font-semibold text-gray-900">
                {formData().scheduleImpactDays || '0'} days
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => props.onCancel?.()}
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting()}
            class="px-6 py-2 text-white rounded-md transition-colors"
            style={{
              'background-color': isSubmitting() ? '#9CA3AF' : '#FF5E15',
              cursor: isSubmitting() ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting() ? 'Creating...' : 'Create Change Order'}
          </button>
        </div>
      </div>
    </form>
  );
}
