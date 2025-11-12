/**
 * RFI (Request for Information) Form Component
 * Creates new RFIs for the project
 */
import { createSignal } from 'solid-js';
import { useTranslation } from '../../i18n/useTranslation';

interface RFIFormProps {
  projectId: number;
  projectInfo?: any;
  rfiNumber?: string;
  onSuccess?: (rfi: any) => void;
  onCancel?: () => void;
}

export default function RFIForm(props: RFIFormProps) {
  const t = useTranslation();
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
          projectId: props.projectId,
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
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 class="text-xl font-bold text-white mb-6">{t('rfis.newRfi')}</h3>

        {error() && (
          <div class="mb-4 p-4 bg-red-900 border border-red-700 rounded-md">
            <p class="text-sm text-red-200">{error()}</p>
          </div>
        )}

        {/* Subject */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {t('rfis.rfiTitle')} *
          </label>
          <input
            type="text"
            required
            value={formData().subject}
            onInput={(e) => updateField('subject', e.currentTarget.value)}
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of the RFI"
          />
        </div>

        {/* Priority */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {t('rfis.priority')}
          </label>
          <select
            value={formData().priority}
            onChange={(e) => updateField('priority', e.currentTarget.value)}
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">{t('tasks.low')}</option>
            <option value="medium">{t('tasks.medium')}</option>
            <option value="high">{t('tasks.high')}</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Description */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {t('rfis.description')}
          </label>
          <textarea
            value={formData().description}
            onInput={(e) => updateField('description', e.currentTarget.value)}
            rows={3}
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide context for this RFI"
          />
        </div>

        {/* Question */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {t('rfis.question')} *
          </label>
          <textarea
            required
            value={formData().question}
            onInput={(e) => updateField('question', e.currentTarget.value)}
            rows={4}
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What specific information do you need?"
          />
        </div>

        {/* Due Date */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {t('rfis.dueDate')}
          </label>
          <input
            type="date"
            value={formData().dueDate}
            onInput={(e) => updateField('dueDate', e.currentTarget.value)}
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Form Actions */}
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={() => props.onCancel?.()}
            class="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting()}
            class="px-6 py-2 text-white rounded-md transition-colors"
            style={{
              'background-color': isSubmitting() ? '#6B7280' : '#4BAAD8',
              cursor: isSubmitting() ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting() ? t('common.loading') : t('rfis.submitRfi')}
          </button>
        </div>
      </div>
    </form>
  );
}
