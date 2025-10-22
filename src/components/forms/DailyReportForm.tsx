/**
 * Daily Report Form Component
 * Creates daily construction reports
 */
import { createSignal } from 'solid-js';

interface DailyReportFormProps {
  projectId: string;
  onSuccess?: (report: any) => void;
  onCancel?: () => void;
}

export default function DailyReportForm(props: DailyReportFormProps) {
  const [formData, setFormData] = createSignal({
    reportDate: new Date().toISOString().split('T')[0], // Today's date
    weatherCondition: '',
    temperature: '',
    totalWorkers: '0',
    workPerformed: '',
    issues: '',
    safetyNotes: '',
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
      if (!data.reportDate || !data.workPerformed) {
        setError('Report date and work performed are required');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: parseInt(props.projectId),
          reportDate: new Date(data.reportDate).toISOString(),
          weatherCondition: data.weatherCondition,
          temperature: data.temperature,
          totalWorkers: parseInt(data.totalWorkers) || 0,
          workPerformed: data.workPerformed,
          issues: data.issues,
          safetyNotes: data.safetyNotes,
          submittedBy: 1, // Mock user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Daily Report');
      }

      const result = await response.json();
      props.onSuccess?.(result.report);

      // Reset form for next day
      setFormData({
        reportDate: new Date().toISOString().split('T')[0],
        weatherCondition: '',
        temperature: '',
        totalWorkers: '0',
        workPerformed: '',
        issues: '',
        safetyNotes: '',
      });
    } catch (err) {
      console.error('Error creating Daily Report:', err);
      setError('Failed to create Daily Report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-6">Daily Construction Report</h3>

        {error() && (
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-800">{error()}</p>
          </div>
        )}

        {/* Report Date */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Report Date *
          </label>
          <input
            type="date"
            required
            value={formData().reportDate}
            onInput={(e) => updateField('reportDate', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Weather Conditions */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Weather Condition
            </label>
            <select
              value={formData().weatherCondition}
              onChange={(e) => updateField('weatherCondition', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select condition...</option>
              <option value="clear">Clear/Sunny</option>
              <option value="partly_cloudy">Partly Cloudy</option>
              <option value="cloudy">Cloudy</option>
              <option value="light_rain">Light Rain</option>
              <option value="heavy_rain">Heavy Rain</option>
              <option value="snow">Snow</option>
              <option value="fog">Fog</option>
              <option value="windy">Windy</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Temperature
            </label>
            <input
              type="text"
              value={formData().temperature}
              onInput={(e) => updateField('temperature', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., 72°F, 25°C"
            />
          </div>
        </div>

        {/* Workforce */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Total Workers On Site
          </label>
          <input
            type="number"
            min="0"
            value={formData().totalWorkers}
            onInput={(e) => updateField('totalWorkers', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Work Performed */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Work Performed Today *
          </label>
          <textarea
            required
            value={formData().workPerformed}
            onInput={(e) => updateField('workPerformed', e.currentTarget.value)}
            rows={5}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Describe the work completed today, areas worked, materials installed, etc."
          />
        </div>

        {/* Issues/Delays */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Issues or Delays
          </label>
          <textarea
            value={formData().issues}
            onInput={(e) => updateField('issues', e.currentTarget.value)}
            rows={3}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Note any problems, delays, or concerns"
          />
        </div>

        {/* Safety Notes */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Safety Notes
          </label>
          <textarea
            value={formData().safetyNotes}
            onInput={(e) => updateField('safetyNotes', e.currentTarget.value)}
            rows={3}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Safety observations, incidents, or toolbox talks conducted"
          />
        </div>

        {/* Info Box */}
        <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Tip:</strong> Daily reports should be submitted at the end of each workday. You can attach photos and additional documentation after submission.
          </p>
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
              'background-color': isSubmitting() ? '#9CA3AF' : '#3D9991',
              cursor: isSubmitting() ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting() ? 'Submitting...' : 'Submit Daily Report'}
          </button>
        </div>
      </div>
    </form>
  );
}
