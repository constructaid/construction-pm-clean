/**
 * Submittal Form Component
 * Creates new product submittals for review
 */
import { createSignal } from 'solid-js';

interface SubmittalFormProps {
  projectId: string;
  onSuccess?: (submittal: any) => void;
  onCancel?: () => void;
}

export default function SubmittalForm(props: SubmittalFormProps) {
  const [formData, setFormData] = createSignal({
    csiDivision: '',
    specSection: '',
    title: '',
    description: '',
    dueDate: '',
  });

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const CSI_DIVISIONS = [
    { code: '01', name: 'General Requirements' },
    { code: '02', name: 'Existing Conditions' },
    { code: '03', name: 'Concrete' },
    { code: '04', name: 'Masonry' },
    { code: '05', name: 'Metals' },
    { code: '06', name: 'Wood, Plastics, and Composites' },
    { code: '07', name: 'Thermal and Moisture Protection' },
    { code: '08', name: 'Openings' },
    { code: '09', name: 'Finishes' },
    { code: '10', name: 'Specialties' },
    { code: '11', name: 'Equipment' },
    { code: '12', name: 'Furnishings' },
    { code: '13', name: 'Special Construction' },
    { code: '14', name: 'Conveying Equipment' },
    { code: '21', name: 'Fire Suppression' },
    { code: '22', name: 'Plumbing' },
    { code: '23', name: 'HVAC' },
    { code: '25', name: 'Integrated Automation' },
    { code: '26', name: 'Electrical' },
    { code: '27', name: 'Communications' },
    { code: '28', name: 'Electronic Safety and Security' },
    { code: '31', name: 'Earthwork' },
    { code: '32', name: 'Exterior Improvements' },
    { code: '33', name: 'Utilities' },
  ];

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = formData();

      // Validate required fields
      if (!data.csiDivision || !data.title) {
        setError('CSI Division and title are required');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/submittals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: parseInt(props.projectId),
          csiDivision: data.csiDivision,
          specSection: data.specSection,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          submittedBy: 1, // Mock user ID
          submittedDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Submittal');
      }

      const result = await response.json();
      props.onSuccess?.(result.submittal);

      // Reset form
      setFormData({
        csiDivision: '',
        specSection: '',
        title: '',
        description: '',
        dueDate: '',
      });
    } catch (err) {
      console.error('Error creating Submittal:', err);
      setError('Failed to create Submittal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-6">Create Product Submittal</h3>

        {error() && (
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-800">{error()}</p>
          </div>
        )}

        {/* CSI Division */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            CSI Division *
          </label>
          <select
            required
            value={formData().csiDivision}
            onChange={(e) => updateField('csiDivision', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select CSI Division...</option>
            {CSI_DIVISIONS.map(div => (
              <option value={div.code}>
                Division {div.code} - {div.name}
              </option>
            ))}
          </select>
        </div>

        {/* Spec Section */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Specification Section
          </label>
          <input
            type="text"
            value={formData().specSection}
            onInput={(e) => updateField('specSection', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., 03 30 00"
          />
          <p class="mt-1 text-xs text-gray-500">Enter the specific spec section if applicable</p>
        </div>

        {/* Title */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Submittal Title *
          </label>
          <input
            type="text"
            required
            value={formData().title}
            onInput={(e) => updateField('title', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Structural Steel Product Data"
          />
        </div>

        {/* Description */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData().description}
            onInput={(e) => updateField('description', e.currentTarget.value)}
            rows={4}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Provide details about the product or material being submitted"
          />
        </div>

        {/* Due Date */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Review Due Date
          </label>
          <input
            type="date"
            value={formData().dueDate}
            onInput={(e) => updateField('dueDate', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Info Box */}
        <div class="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
          <h4 class="font-medium text-purple-900 mb-2">Submittal Workflow</h4>
          <p class="text-sm text-purple-800 mb-2">
            Your submittal will follow this review process:
          </p>
          <ol class="text-sm text-purple-800 list-decimal list-inside space-y-1">
            <li>Subcontractor submits product data</li>
            <li>General Contractor reviews and forwards</li>
            <li>Architect/Designer reviews and approves</li>
            <li>Final decision communicated to all parties</li>
          </ol>
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
              'background-color': isSubmitting() ? '#9CA3AF' : '#7C3AED',
              cursor: isSubmitting() ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting() ? 'Creating...' : 'Create Submittal'}
          </button>
        </div>
      </div>
    </form>
  );
}
