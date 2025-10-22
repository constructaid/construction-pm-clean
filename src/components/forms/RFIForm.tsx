/**
 * RFI (Request for Information) Form Component
 * Creates new RFIs for the project
 */
import { createSignal } from 'solid-js';

interface RFIFormProps {
  projectId: string;
  onSuccess?: (rfi: any) => void;
  onCancel?: () => void;
}

export default function RFIForm(props: RFIFormProps) {
  const [formData, setFormData] = createSignal({
    subject: '',
    description: '',
    question: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assignedTo: '',
    dueDate: '',
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
      if (!data.subject || !data.question) {
        setError('Subject and question are required');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/rfis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: parseInt(props.projectId),
          ...data,
          assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
          submittedBy: 1, // Mock user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create RFI');
      }

      const result = await response.json();
      props.onSuccess?.(result.rfi);

      // Reset form
      setFormData({
        subject: '',
        description: '',
        question: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
      });
    } catch (err) {
      console.error('Error creating RFI:', err);
      setError('Failed to create RFI. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-6">Create Request for Information (RFI)</h3>

        {error() && (
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-800">{error()}</p>
          </div>
        )}

        {/* Subject */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            required
            value={formData().subject}
            onInput={(e) => updateField('subject', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of the RFI"
          />
        </div>

        {/* Priority */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={formData().priority}
            onChange={(e) => updateField('priority', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Description */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData().description}
            onInput={(e) => updateField('description', e.currentTarget.value)}
            rows={3}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide context for this RFI"
          />
        </div>

        {/* Question */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Question *
          </label>
          <textarea
            required
            value={formData().question}
            onInput={(e) => updateField('question', e.currentTarget.value)}
            rows={4}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What specific information do you need?"
          />
        </div>

        {/* Due Date */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <input
            type="date"
            value={formData().dueDate}
            onInput={(e) => updateField('dueDate', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
              'background-color': isSubmitting() ? '#9CA3AF' : '#4BAAD8',
              cursor: isSubmitting() ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting() ? 'Creating...' : 'Create RFI'}
          </button>
        </div>
      </div>
    </form>
  );
}
