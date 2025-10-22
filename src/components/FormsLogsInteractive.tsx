/**
 * Interactive Forms & Logs Component (SolidJS)
 * Handles daily logs, safety reports, and inspection checklists
 * with CSI Division categorization
 */
import { createSignal, Show } from 'solid-js';

interface FormsLogsInteractiveProps {
  projectId: string;
}

type TabType = 'daily' | 'safety' | 'inspection';

interface DailyLogData {
  date: string;
  weather: string;
  temperature: string;
  workPerformed: string;
  equipmentUsed: string;
  materialsDelivered: string;
  workersOnSite: string;
  visitors: string;
  csiDivision: string;
  delays: string;
  safetyIncidents: string;
  notes: string;
}

export default function FormsLogsInteractive(props: FormsLogsInteractiveProps) {
  const [activeTab, setActiveTab] = createSignal<TabType>('daily');
  const [formData, setFormData] = createSignal<DailyLogData>({
    date: new Date().toISOString().split('T')[0],
    weather: '',
    temperature: '',
    workPerformed: '',
    equipmentUsed: '',
    materialsDelivered: '',
    workersOnSite: '',
    visitors: '',
    csiDivision: '',
    delays: '',
    safetyIncidents: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [submitSuccess, setSubmitSuccess] = createSignal(false);

  // Update form field
  const updateField = (field: keyof DailyLogData, value: string) => {
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
            csiDivision: '',
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

  const tabs: { id: TabType; label: string }[] = [
    { id: 'daily', label: 'Daily Log' },
    { id: 'safety', label: 'Safety Report' },
    { id: 'inspection', label: 'Inspection Checklist' }
  ];

  const weatherOptions = [
    { value: '', label: 'Select...' },
    { value: 'sunny', label: '☀️ Sunny' },
    { value: 'cloudy', label: '☁️ Cloudy' },
    { value: 'rainy', label: '🌧️ Rainy' },
    { value: 'snowy', label: '❄️ Snowy' },
    { value: 'windy', label: '💨 Windy' }
  ];

  const csiDivisions = [
    { code: '', name: 'Select CSI Division...' },
    { code: '01', name: 'General Requirements' },
    { code: '03', name: 'Concrete' },
    { code: '04', name: 'Masonry' },
    { code: '05', name: 'Metals' },
    { code: '22', name: 'Plumbing' },
    { code: '23', name: 'HVAC' },
    { code: '26', name: 'Electrical' }
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div class="flex space-x-4 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            onClick={() => setActiveTab(tab.id)}
            class={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab() === tab.id
                ? 'border-primary-orange text-primary-orange'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Success Message */}
      <Show when={submitSuccess()}>
        <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4 animate-slide-in">
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="font-semibold">Form submitted successfully!</p>
          </div>
        </div>
      </Show>

      {/* Daily Log Form */}
      <Show when={activeTab() === 'daily'}>
        <form onSubmit={handleSubmit} class="space-y-4">
          {/* Date, Weather, Temperature */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">
                Date <span class="text-primary-orange">*</span>
              </label>
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
              >
                {weatherOptions.map((option) => (
                  <option value={option.value}>{option.label}</option>
                ))}
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

          {/* CSI Division */}
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              CSI Division (Work Category)
            </label>
            <select
              value={formData().csiDivision}
              onChange={(e) => updateField('csiDivision', e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            >
              {csiDivisions.map((division) => (
                <option value={division.code}>
                  {division.code && `Division ${division.code} - `}{division.name}
                </option>
              ))}
            </select>
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

          {/* Delays & Safety */}
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

          {/* Notes */}
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
          <div class="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting()}
              class="px-6 py-2 bg-primary-orange text-white font-medium rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-ca-sm"
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

      {/* Safety Report */}
      <Show when={activeTab() === 'safety'}>
        <div class="text-center py-12 text-text-secondary">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p class="font-medium mb-2">Safety Report Form</p>
          <p class="text-sm">Coming Soon - Full safety reporting functionality</p>
        </div>
      </Show>

      {/* Inspection Checklist */}
      <Show when={activeTab() === 'inspection'}>
        <div class="text-center py-12 text-text-secondary">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p class="font-medium mb-2">Inspection Checklist</p>
          <p class="text-sm">Coming Soon - Customizable inspection checklists</p>
        </div>
      </Show>
    </div>
  );
}
