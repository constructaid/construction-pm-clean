/**
 * Daily Field Report Form Component
 * Comprehensive daily construction report tracking all activities and deliverables
 */
import { createSignal, For, Show } from 'solid-js';
import { useTranslation } from '../../i18n/useTranslation';

interface DailyReportFormProps {
  projectId: number;
  reportNumber?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface WorkforceEntry {
  trade: string;
  count: number;
  company: string;
}

interface EquipmentEntry {
  equipment: string;
  hours: number;
  operator: string;
}

interface MaterialDelivery {
  material: string;
  quantity: string;
  supplier: string;
  timeDelivered: string;
  receivedBy: string;
}

interface WorkActivity {
  area: string;
  work: string;
  crew: string;
  percentComplete: number;
}

interface Visitor {
  name: string;
  company: string;
  purpose: string;
  timeIn: string;
  timeOut: string;
}

export default function DailyReportForm(props: DailyReportFormProps) {
  const t = useTranslation();
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  // Basic Information
  const [reportDate, setReportDate] = createSignal('');
  const [submittedBy, setSubmittedBy] = createSignal('');
  const [weatherCondition, setWeatherCondition] = createSignal('');
  const [temperature, setTemperature] = createSignal('');
  const [startTime, setStartTime] = createSignal('07:00');
  const [endTime, setEndTime] = createSignal('17:00');

  // Workforce
  const [workforceEntries, setWorkforceEntries] = createSignal<WorkforceEntry[]>([
    { trade: '', count: 0, company: '' }
  ]);

  // Equipment
  const [equipmentEntries, setEquipmentEntries] = createSignal<EquipmentEntry[]>([]);

  // Material Deliveries
  const [materialDeliveries, setMaterialDeliveries] = createSignal<MaterialDelivery[]>([]);

  // Work Activities
  const [workActivities, setWorkActivities] = createSignal<WorkActivity[]>([
    { area: '', work: '', crew: '', percentComplete: 0 }
  ]);

  // Visitors
  const [visitors, setVisitors] = createSignal<Visitor[]>([]);

  // Issues and Notes
  const [safetyIssues, setSafetyIssues] = createSignal('');
  const [delaysIssues, setDelaysIssues] = createSignal('');
  const [inspections, setInspections] = createSignal('');
  const [plannedWork, setPlannedWork] = createSignal('');
  const [additionalNotes, setAdditionalNotes] = createSignal('');

  // Deliverables/Milestones
  const [deliverables, setDeliverables] = createSignal<string[]>(['']);

  // Add/Update/Remove functions
  const addWorkforceEntry = () => {
    setWorkforceEntries([...workforceEntries(), { trade: '', count: 0, company: '' }]);
  };

  const updateWorkforceEntry = <K extends keyof WorkforceEntry>(index: number, field: K, value: WorkforceEntry[K]) => {
    const updated = [...workforceEntries()];
    updated[index] = { ...updated[index], [field]: value };
    setWorkforceEntries(updated);
  };

  const removeWorkforceEntry = (index: number) => {
    setWorkforceEntries(workforceEntries().filter((_, i) => i !== index));
  };

  const addEquipmentEntry = () => {
    setEquipmentEntries([...equipmentEntries(), { equipment: '', hours: 0, operator: '' }]);
  };

  const updateEquipmentEntry = <K extends keyof EquipmentEntry>(index: number, field: K, value: EquipmentEntry[K]) => {
    const updated = [...equipmentEntries()];
    updated[index] = { ...updated[index], [field]: value };
    setEquipmentEntries(updated);
  };

  const removeEquipmentEntry = (index: number) => {
    setEquipmentEntries(equipmentEntries().filter((_, i) => i !== index));
  };

  const addMaterialDelivery = () => {
    setMaterialDeliveries([...materialDeliveries(), { material: '', quantity: '', supplier: '', timeDelivered: '', receivedBy: '' }]);
  };

  const updateMaterialDelivery = <K extends keyof MaterialDelivery>(index: number, field: K, value: MaterialDelivery[K]) => {
    const updated = [...materialDeliveries()];
    updated[index] = { ...updated[index], [field]: value };
    setMaterialDeliveries(updated);
  };

  const removeMaterialDelivery = (index: number) => {
    setMaterialDeliveries(materialDeliveries().filter((_, i) => i !== index));
  };

  const addWorkActivity = () => {
    setWorkActivities([...workActivities(), { area: '', work: '', crew: '', percentComplete: 0 }]);
  };

  const updateWorkActivity = <K extends keyof WorkActivity>(index: number, field: K, value: WorkActivity[K]) => {
    const updated = [...workActivities()];
    updated[index] = { ...updated[index], [field]: value };
    setWorkActivities(updated);
  };

  const removeWorkActivity = (index: number) => {
    setWorkActivities(workActivities().filter((_, i) => i !== index));
  };

  const addVisitor = () => {
    setVisitors([...visitors(), { name: '', company: '', purpose: '', timeIn: '', timeOut: '' }]);
  };

  const updateVisitor = <K extends keyof Visitor>(index: number, field: K, value: Visitor[K]) => {
    const updated = [...visitors()];
    updated[index] = { ...updated[index], [field]: value };
    setVisitors(updated);
  };

  const removeVisitor = (index: number) => {
    setVisitors(visitors().filter((_, i) => i !== index));
  };

  const addDeliverable = () => {
    setDeliverables([...deliverables(), '']);
  };

  const updateDeliverable = (index: number, value: string) => {
    const updated = [...deliverables()];
    updated[index] = value;
    setDeliverables(updated);
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables().filter((_, i) => i !== index));
  };

  const calculateTotalWorkers = () => {
    return workforceEntries().reduce((sum, entry) => sum + (entry.count || 0), 0);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!reportDate()) {
      setError('Report date is required');
      return;
    }

    if (!submittedBy()) {
      setError('Submitted by is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        projectId: props.projectId,
        reportDate: new Date(reportDate()).toISOString(),
        reportNumber: props.reportNumber || `DR-${Date.now()}`,

        // Basic info
        submittedBy: submittedBy(),
        startTime: startTime(),
        endTime: endTime(),

        // Weather
        weatherCondition: weatherCondition(),
        temperature: temperature(),

        // Workforce
        workforceCount: workforceEntries().reduce((acc, entry) => {
          if (entry.trade) acc[entry.trade] = entry.count;
          return acc;
        }, {} as Record<string, number>),
        totalWorkers: calculateTotalWorkers(),
        workforceDetails: workforceEntries().filter(e => e.trade),

        // Equipment
        equipmentUsed: equipmentEntries().filter(e => e.equipment),

        // Materials
        materialsDelivered: materialDeliveries().filter(m => m.material),

        // Work performed
        workActivities: workActivities().filter(w => w.area || w.work),
        workPerformed: workActivities()
          .filter(w => w.work)
          .map(w => `${w.area ? w.area + ': ' : ''}${w.work}`)
          .join('\n'),
        areasWorked: workActivities()
          .filter(w => w.area)
          .map(w => w.area),

        // Visitors
        visitorsOnSite: visitors().filter(v => v.name),

        // Issues and notes
        safetyNotes: safetyIssues(),
        issues: delaysIssues(),
        inspections: inspections(),
        plannedWorkTomorrow: plannedWork(),
        additionalNotes: additionalNotes(),

        // Deliverables
        deliverables: deliverables().filter(d => d.trim() !== ''),

        photos: [],
      };

      const response = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save daily report');
      }

      if (props.onSuccess) {
        props.onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save daily report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {/* Header */}
      <div class="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-semibold text-blue-900">{t('field.dailyFieldReport')}</h3>
            <p class="text-sm text-blue-800 mt-1">
              {t('field.comprehensiveReport')}
            </p>
          </div>
        </div>
      </div>

      <Show when={error()}>
        <div class="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <p class="text-sm text-red-800">{error()}</p>
        </div>
      </Show>

      {/* Basic Information */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{t('field.reportInformation')}</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{t('field.reportDate')} *</label>
            <input
              type="date"
              value={reportDate()}
              onInput={(e) => setReportDate(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{t('field.reportNumber')}</label>
            <input
              type="text"
              value={props.reportNumber || ''}
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{t('field.submittedBy')} *</label>
            <input
              type="text"
              value={submittedBy()}
              onInput={(e) => setSubmittedBy(e.currentTarget.value)}
              placeholder={t('field.yourName')}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{t('field.startTime')}</label>
            <input
              type="time"
              value={startTime()}
              onInput={(e) => setStartTime(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{t('field.endTime')}</label>
            <input
              type="time"
              value={endTime()}
              onInput={(e) => setEndTime(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{t('field.weather')}</label>
            <select
              value={weatherCondition()}
              onInput={(e) => setWeatherCondition(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('field.selectWeather')}</option>
              <option value="Clear">{t('field.clear')}</option>
              <option value="Partly Cloudy">{t('field.partlyCloudy')}</option>
              <option value="Cloudy">{t('field.cloudy')}</option>
              <option value="Rain">{t('field.rain')}</option>
              <option value="Snow">{t('field.snow')}</option>
              <option value="Fog">{t('field.fog')}</option>
              <option value="Wind">{t('field.windy')}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{t('field.temperature')}</label>
            <input
              type="text"
              value={temperature()}
              onInput={(e) => setTemperature(e.currentTarget.value)}
              placeholder="e.g., 72°F"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Workforce */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Workforce on Site</h3>
            <p class="text-sm text-gray-600">Total Workers: <strong>{calculateTotalWorkers()}</strong></p>
          </div>
          <button
            type="button"
            onClick={addWorkforceEntry}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Add Trade
          </button>
        </div>

        <div class="space-y-3">
          <For each={workforceEntries()}>
            {(entry, index) => (
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Trade/Craft</label>
                    <input
                      type="text"
                      value={entry.trade}
                      onInput={(e) => updateWorkforceEntry(index(), 'trade', e.currentTarget.value)}
                      placeholder="e.g., Carpenter, Electrician"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Count</label>
                    <input
                      type="number"
                      value={entry.count}
                      onInput={(e) => updateWorkforceEntry(index(), 'count', parseInt(e.currentTarget.value) || 0)}
                      min="0"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={entry.company}
                      onInput={(e) => updateWorkforceEntry(index(), 'company', e.currentTarget.value)}
                      placeholder="Company name"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div class="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeWorkforceEntry(index())}
                      class="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Work Activities */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Work Activities Performed</h3>
          <button
            type="button"
            onClick={addWorkActivity}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            + Add Activity
          </button>
        </div>

        <div class="space-y-3">
          <For each={workActivities()}>
            {(activity, index) => (
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Area/Location</label>
                    <input
                      type="text"
                      value={activity.area}
                      onInput={(e) => updateWorkActivity(index(), 'area', e.currentTarget.value)}
                      placeholder="e.g., Building A - 2nd Floor"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Crew/Trade</label>
                    <input
                      type="text"
                      value={activity.crew}
                      onInput={(e) => updateWorkActivity(index(), 'crew', e.currentTarget.value)}
                      placeholder="e.g., Framing crew"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Work Performed</label>
                    <textarea
                      value={activity.work}
                      onInput={(e) => updateWorkActivity(index(), 'work', e.currentTarget.value)}
                      placeholder="Describe the work performed..."
                      rows={2}
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">% Complete</label>
                    <input
                      type="number"
                      value={activity.percentComplete}
                      onInput={(e) => updateWorkActivity(index(), 'percentComplete', parseInt(e.currentTarget.value) || 0)}
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div class="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeWorkActivity(index())}
                      class="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Remove Activity
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Material Deliveries */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Material Deliveries</h3>
          <button
            type="button"
            onClick={addMaterialDelivery}
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            + Add Delivery
          </button>
        </div>

        <Show when={materialDeliveries().length === 0}>
          <p class="text-gray-500 text-center py-4 text-sm">No deliveries recorded today</p>
        </Show>

        <div class="space-y-3">
          <For each={materialDeliveries()}>
            {(delivery, index) => (
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Material</label>
                    <input
                      type="text"
                      value={delivery.material}
                      onInput={(e) => updateMaterialDelivery(index(), 'material', e.currentTarget.value)}
                      placeholder="e.g., Concrete, Lumber"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="text"
                      value={delivery.quantity}
                      onInput={(e) => updateMaterialDelivery(index(), 'quantity', e.currentTarget.value)}
                      placeholder="e.g., 10 yards, 500 boards"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={delivery.supplier}
                      onInput={(e) => updateMaterialDelivery(index(), 'supplier', e.currentTarget.value)}
                      placeholder="Supplier name"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Time Delivered</label>
                    <input
                      type="time"
                      value={delivery.timeDelivered}
                      onInput={(e) => updateMaterialDelivery(index(), 'timeDelivered', e.currentTarget.value)}
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Received By</label>
                    <input
                      type="text"
                      value={delivery.receivedBy}
                      onInput={(e) => updateMaterialDelivery(index(), 'receivedBy', e.currentTarget.value)}
                      placeholder="Name"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div class="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeMaterialDelivery(index())}
                      class="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Equipment */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Equipment Used</h3>
          <button
            type="button"
            onClick={addEquipmentEntry}
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
          >
            + Add Equipment
          </button>
        </div>

        <Show when={equipmentEntries().length === 0}>
          <p class="text-gray-500 text-center py-4 text-sm">No equipment logged today</p>
        </Show>

        <div class="space-y-3">
          <For each={equipmentEntries()}>
            {(equipment, index) => (
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Equipment</label>
                    <input
                      type="text"
                      value={equipment.equipment}
                      onInput={(e) => updateEquipmentEntry(index(), 'equipment', e.currentTarget.value)}
                      placeholder="e.g., Excavator, Crane, Forklift"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Hours Used</label>
                    <input
                      type="number"
                      value={equipment.hours}
                      onInput={(e) => updateEquipmentEntry(index(), 'hours', parseFloat(e.currentTarget.value) || 0)}
                      step="0.5"
                      min="0"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                    <input
                      type="text"
                      value={equipment.operator}
                      onInput={(e) => updateEquipmentEntry(index(), 'operator', e.currentTarget.value)}
                      placeholder="Operator name"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div class="md:col-span-4">
                    <button
                      type="button"
                      onClick={() => removeEquipmentEntry(index())}
                      class="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Equipment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Visitors */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Visitors on Site</h3>
          <button
            type="button"
            onClick={addVisitor}
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            + Add Visitor
          </button>
        </div>

        <Show when={visitors().length === 0}>
          <p class="text-gray-500 text-center py-4 text-sm">No visitors recorded today</p>
        </Show>

        <div class="space-y-3">
          <For each={visitors()}>
            {(visitor, index) => (
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={visitor.name}
                      onInput={(e) => updateVisitor(index(), 'name', e.currentTarget.value)}
                      placeholder="Visitor name"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={visitor.company}
                      onInput={(e) => updateVisitor(index(), 'company', e.currentTarget.value)}
                      placeholder="Company"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Purpose</label>
                    <input
                      type="text"
                      value={visitor.purpose}
                      onInput={(e) => updateVisitor(index(), 'purpose', e.currentTarget.value)}
                      placeholder="Purpose of visit"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Time In</label>
                    <input
                      type="time"
                      value={visitor.timeIn}
                      onInput={(e) => updateVisitor(index(), 'timeIn', e.currentTarget.value)}
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Time Out</label>
                    <input
                      type="time"
                      value={visitor.timeOut}
                      onInput={(e) => updateVisitor(index(), 'timeOut', e.currentTarget.value)}
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div class="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeVisitor(index())}
                      class="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Deliverables/Milestones */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Deliverables & Milestones Achieved</h3>
          <button
            type="button"
            onClick={addDeliverable}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            + Add Deliverable
          </button>
        </div>

        <div class="space-y-2">
          <For each={deliverables()}>
            {(deliverable, index) => (
              <div class="flex gap-2">
                <input
                  type="text"
                  value={deliverable}
                  onInput={(e) => updateDeliverable(index(), e.currentTarget.value)}
                  placeholder="e.g., Foundation complete, Roof installed, Inspection passed"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => removeDeliverable(index())}
                  class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Issues and Notes */}
      <div class="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 class="text-lg font-semibold text-gray-900">Issues, Notes & Planning</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Safety Issues/Observations</label>
          <textarea
            value={safetyIssues()}
            onInput={(e) => setSafetyIssues(e.currentTarget.value)}
            rows={3}
            placeholder="Any safety concerns or observations..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Delays or Issues</label>
          <textarea
            value={delaysIssues()}
            onInput={(e) => setDelaysIssues(e.currentTarget.value)}
            rows={3}
            placeholder="Any delays, problems, or challenges encountered..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Inspections Conducted</label>
          <textarea
            value={inspections()}
            onInput={(e) => setInspections(e.currentTarget.value)}
            rows={2}
            placeholder="List any inspections performed today..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Planned Work for Tomorrow</label>
          <textarea
            value={plannedWork()}
            onInput={(e) => setPlannedWork(e.currentTarget.value)}
            rows={3}
            placeholder="What work is planned for tomorrow..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea
            value={additionalNotes()}
            onInput={(e) => setAdditionalNotes(e.currentTarget.value)}
            rows={3}
            placeholder="Any other relevant information..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <Show when={props.onCancel}>
          <button
            type="button"
            onClick={props.onCancel}
            class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            disabled={isSubmitting()}
          >
            Cancel
          </button>
        </Show>
        <button
          type="submit"
          class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          disabled={isSubmitting()}
        >
          {isSubmitting() ? 'Saving...' : 'Save Daily Report'}
        </button>
      </div>
    </form>
  );
}
