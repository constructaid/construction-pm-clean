/**
 * Forms & Logs Tab Component
 * Allows users to submit daily logs, safety reports, and other forms
 */
import { createSignal, Show } from 'solid-js';

interface FormsLogsTabProps {
  projectId: string;
}

export default function FormsLogsTab(props: FormsLogsTabProps) {
  const [activeTab, setActiveTab] = createSignal<'daily' | 'safety' | 'inspection'>('daily');
  const [formData, setFormData] = createSignal({
    date: new Date().toISOString().split('T')[0],
    weather: '',
    temperature: '',
    workPerformed: '',
    equipmentUsed: '',
    materialsDelivered: '',
    workersOnSite: '',
    visitors: '',
    delays: '',
    safetyIncidents: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [submitSuccess, setSubmitSuccess] = createSignal(false);

  // Update form field
  const updateField = (field: string, value: string) => {
    setFormData({ ...formData(), [field]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const response = await fetch('/api/forms/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: props.projectId,
          type: activeTab(),
          data: formData()
        })
      });

      if (response.ok) {
        setSubmitSuccess(true);
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            date: new Date().toISOString().split('T')[0],
            weather: '',
            temperature: '',
            workPerformed: '',
            equipmentUsed: '',
            materialsDelivered: '',
            workersOnSite: '',
            visitors: '',
            delays: '',
            safetyIncidents: '',
            notes: ''
          });
          setSubmitSuccess(false);
        }, 2000);
      } else {
        alert('Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div class="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('daily')}
          class={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
            activeTab() === 'daily'
              ? 'border-primary-orange text-primary-orange'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Daily Log
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          class={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
            activeTab() === 'safety'
              ? 'border-primary-orange text-primary-orange'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Safety Report
        </button>
        <button
          onClick={() => setActiveTab('inspection')}
          class={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
            activeTab() === 'inspection'
              ? 'border-primary-orange text-primary-orange'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Inspection Checklist
        </button>
      </div>

      {/* Success Message */}
      <Show when={submitSuccess()}>
        <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
          <p class="font-semibold">✓ Form submitted successfully!</p>
        </div>
      </Show>

      {/* Daily Log Form */}
      <Show when={activeTab() === 'daily'}>
        <form onSubmit={handleSubmit} class="space-y-4">
          {/* Date */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Date</label>
              <input
                type="date"
                value={formData().date}
                onInput={(e) => updateField('date', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Weather</label>
              <select
                value={formData().weather}
                onChange={(e) => updateField('weather', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                required
              >
                <option value="">Select...</option>
                <option value="sunny">☀️ Sunny</option>
                <option value="cloudy">☁️ Cloudy</option>
                <option value="rainy">🌧️ Rainy</option>
                <option value="snowy">❄️ Snowy</option>
                <option value="windy">💨 Windy</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Temperature (°F)</label>
              <input
                type="number"
                value={formData().temperature}
                onInput={(e) => updateField('temperature', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="72"
              />
            </div>
          </div>

          {/* Work Performed */}
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Work Performed Today <span class="text-primary-orange">*</span>
            </label>
            <textarea
              value={formData().workPerformed}
              onInput={(e) => updateField('workPerformed', e.currentTarget.value)}
              rows={3}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="Describe the work completed today..."
              required
            ></textarea>
          </div>

          {/* Equipment & Materials */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Equipment Used</label>
              <input
                type="text"
                value={formData().equipmentUsed}
                onInput={(e) => updateField('equipmentUsed', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="Crane, excavator, etc."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Materials Delivered</label>
              <input
                type="text"
                value={formData().materialsDelivered}
                onInput={(e) => updateField('materialsDelivered', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="Concrete, lumber, etc."
              />
            </div>
          </div>

          {/* Personnel */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Workers On Site</label>
              <input
                type="number"
                value={formData().workersOnSite}
                onInput={(e) => updateField('workersOnSite', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="12"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Visitors</label>
              <input
                type="text"
                value={formData().visitors}
                onInput={(e) => updateField('visitors', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="Owner, architect, inspector, etc."
              />
            </div>
          </div>

          {/* Delays & Incidents */}
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Delays or Issues</label>
            <textarea
              value={formData().delays}
              onInput={(e) => updateField('delays', e.currentTarget.value)}
              rows={2}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="Document any delays, issues, or problems encountered..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Safety Incidents</label>
            <textarea
              value={formData().safetyIncidents}
              onInput={(e) => updateField('safetyIncidents', e.currentTarget.value)}
              rows={2}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="Report any safety incidents or near-misses..."
            ></textarea>
          </div>

          {/* Additional Notes */}
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Additional Notes</label>
            <textarea
              value={formData().notes}
              onInput={(e) => updateField('notes', e.currentTarget.value)}
              rows={2}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="Any other relevant information..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <div class="flex items-center space-x-3">
            <button
              type="submit"
              disabled={isSubmitting()}
              class="px-6 py-2 bg-primary-orange text-white font-medium rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting() ? 'Submitting...' : 'Submit Daily Log'}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = `/projects/${props.projectId}/logs`}
              class="px-6 py-2 border border-gray-300 text-text-primary font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              View All Logs
            </button>
          </div>
        </form>
      </Show>

      {/* Safety Report Form */}
      <Show when={activeTab() === 'safety'}>
        <div class="text-center py-12 text-text-secondary">
          <p class="mb-2">Safety Report Form</p>
          <p class="text-sm">Coming Soon - Full safety reporting functionality</p>
        </div>
      </Show>

      {/* Inspection Checklist */}
      <Show when={activeTab() === 'inspection'}>
        <div class="text-center py-12 text-text-secondary">
          <p class="mb-2">Inspection Checklist</p>
          <p class="text-sm">Coming Soon - Customizable inspection checklists</p>
        </div>
      </Show>
    </div>
  );
}
