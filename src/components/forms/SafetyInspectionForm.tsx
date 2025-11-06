/**
 * Safety Inspection Form Component
 * Daily/Weekly Safety Inspections - DISD Exhibit 5-2
 */
import { createSignal, For, Show } from 'solid-js';

interface SafetyInspectionFormProps {
  projectId: number;
  inspectionNumber?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ChecklistItem {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'na';
  notes: string;
  photo?: string;
}

interface CorrectiveAction {
  issue: string;
  action: string;
  assignedTo: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'completed';
}

export default function SafetyInspectionForm(props: SafetyInspectionFormProps) {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  // Form fields
  const [inspectionType, setInspectionType] = createSignal<'daily' | 'weekly' | 'crane' | 'scaffold' | 'excavation' | 'electrical' | 'fire_prevention'>('daily');
  const [inspectionDate, setInspectionDate] = createSignal('');
  const [inspectorName, setInspectorName] = createSignal('');
  const [inspectorCompany, setInspectorCompany] = createSignal('');
  const [areasInspected, setAreasInspected] = createSignal<string[]>(['']);
  const [weatherCondition, setWeatherCondition] = createSignal('');
  const [temperature, setTemperature] = createSignal('');
  const [comments, setComments] = createSignal('');

  // Checklist items
  const [checklistItems, setChecklistItems] = createSignal<ChecklistItem[]>([
    { category: 'Housekeeping', item: 'Work areas clean and organized', status: 'pass', notes: '' },
    { category: 'Housekeeping', item: 'Debris removed regularly', status: 'pass', notes: '' },
    { category: 'Fall Protection', item: 'Guardrails in place and secure', status: 'pass', notes: '' },
    { category: 'Fall Protection', item: 'Personal fall arrest systems used', status: 'pass', notes: '' },
    { category: 'Scaffolding', item: 'Scaffolds properly erected and tagged', status: 'pass', notes: '' },
    { category: 'Scaffolding', item: 'Access ladders secured', status: 'pass', notes: '' },
    { category: 'Ladders', item: 'Ladders in good condition', status: 'pass', notes: '' },
    { category: 'Ladders', item: '3-foot extension above landing', status: 'pass', notes: '' },
    { category: 'Electrical', item: 'GFCI protection in use', status: 'pass', notes: '' },
    { category: 'Electrical', item: 'Cords in good condition', status: 'pass', notes: '' },
    { category: 'Fire Safety', item: 'Fire extinguishers accessible', status: 'pass', notes: '' },
    { category: 'Fire Safety', item: 'Exit routes clear', status: 'pass', notes: '' },
    { category: 'PPE', item: 'Hard hats worn', status: 'pass', notes: '' },
    { category: 'PPE', item: 'Safety glasses used', status: 'pass', notes: '' },
    { category: 'PPE', item: 'High-visibility vests worn', status: 'pass', notes: '' },
    { category: 'Signage', item: 'Warning signs posted', status: 'pass', notes: '' },
    { category: 'Signage', item: 'Exit signs visible', status: 'pass', notes: '' },
    { category: 'Barricades', item: 'Hazard areas barricaded', status: 'pass', notes: '' },
    { category: 'Equipment', item: 'Equipment properly guarded', status: 'pass', notes: '' },
    { category: 'Equipment', item: 'Tools in safe working condition', status: 'pass', notes: '' },
  ]);

  const [correctiveActions, setCorrectiveActions] = createSignal<CorrectiveAction[]>([]);

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const updated = [...checklistItems()];
    updated[index][field] = value;
    setChecklistItems(updated);
  };

  const addCorrectiveAction = () => {
    setCorrectiveActions([
      ...correctiveActions(),
      { issue: '', action: '', assignedTo: '', dueDate: '', status: 'open' }
    ]);
  };

  const updateCorrectiveAction = (index: number, field: keyof CorrectiveAction, value: any) => {
    const updated = [...correctiveActions()];
    updated[index][field] = value;
    setCorrectiveActions(updated);
  };

  const removeCorrectiveAction = (index: number) => {
    setCorrectiveActions(correctiveActions().filter((_, i) => i !== index));
  };

  const addArea = () => {
    setAreasInspected([...areasInspected(), '']);
  };

  const updateArea = (index: number, value: string) => {
    const updated = [...areasInspected()];
    updated[index] = value;
    setAreasInspected(updated);
  };

  const removeArea = (index: number) => {
    setAreasInspected(areasInspected().filter((_, i) => i !== index));
  };

  const calculateViolations = () => {
    return checklistItems().filter(item => item.status === 'fail').length;
  };

  const calculateOverallStatus = () => {
    const violations = calculateViolations();
    if (violations === 0) return 'pass';
    if (violations > 5) return 'fail';
    return 'conditional';
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!inspectionDate()) {
      setError('Inspection date is required');
      return;
    }

    if (!inspectorName()) {
      setError('Inspector name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const violations = calculateViolations();
      const hazards = checklistItems()
        .filter(item => item.status === 'fail')
        .map(item => ({
          category: item.category,
          item: item.item,
          notes: item.notes
        }));

      const inspectionData = {
        projectId: props.projectId,
        inspectionNumber: props.inspectionNumber || `SI-${Date.now()}`,
        inspectionType: inspectionType(),
        inspectionDate: new Date(`${inspectionDate()}T${new Date().getHours()}:${new Date().getMinutes()}`).toISOString(),
        inspectedBy: 1, // TODO: Get from session
        inspectorName: inspectorName(),
        inspectorCompany: inspectorCompany() || null,
        areasInspected: areasInspected().filter(a => a.trim() !== ''),
        checklistItems: checklistItems(),
        violationsFound: violations,
        hazardsIdentified: hazards,
        correctiveActions: correctiveActions(),
        weatherCondition: weatherCondition() || null,
        temperature: temperature() || null,
        overallStatus: calculateOverallStatus(),
        comments: comments() || null,
        requiresFollowUp: violations > 0,
        followUpCompleted: false,
        photos: [],
        attachments: [],
      };

      const response = await fetch('/api/safety/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save inspection');
      }

      if (props.onSuccess) {
        props.onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {/* DISD Header */}
      <div class="bg-green-50 border-l-4 border-green-600 p-4 rounded-lg">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-semibold text-green-900">DISD Safety Inspection Checklist</h3>
            <p class="text-sm text-green-800 mt-1">
              Exhibit 5-2 - Daily/weekly inspections required for DISD compliance
            </p>
          </div>
        </div>
      </div>

      <Show when={error()}>
        <div class="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <p class="text-sm text-red-800">{error()}</p>
        </div>
      </Show>

      {/* Inspection Information */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Inspection Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Inspection Type *</label>
            <select
              value={inspectionType()}
              onInput={(e) => setInspectionType(e.currentTarget.value as any)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="daily">Daily Inspection</option>
              <option value="weekly">Weekly Inspection</option>
              <option value="crane">Crane Inspection</option>
              <option value="scaffold">Scaffold Inspection</option>
              <option value="excavation">Excavation Inspection</option>
              <option value="electrical">Electrical Inspection</option>
              <option value="fire_prevention">Fire Prevention Inspection</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Inspection Number</label>
            <input
              type="text"
              value={props.inspectionNumber || ''}
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Inspection Date *</label>
            <input
              type="date"
              value={inspectionDate()}
              onInput={(e) => setInspectionDate(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Inspector Name *</label>
            <input
              type="text"
              value={inspectorName()}
              onInput={(e) => setInspectorName(e.currentTarget.value)}
              placeholder="Your name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Inspector Company</label>
            <input
              type="text"
              value={inspectorCompany()}
              onInput={(e) => setInspectorCompany(e.currentTarget.value)}
              placeholder="Company name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Weather Condition</label>
            <input
              type="text"
              value={weatherCondition()}
              onInput={(e) => setWeatherCondition(e.currentTarget.value)}
              placeholder="Sunny, Cloudy, Rainy, etc."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input
              type="text"
              value={temperature()}
              onInput={(e) => setTemperature(e.currentTarget.value)}
              placeholder="e.g., 72°F"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Areas Inspected */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Areas Inspected</h3>
          <button
            type="button"
            onClick={addArea}
            class="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            + Add Area
          </button>
        </div>
        <div class="space-y-2">
          <For each={areasInspected()}>
            {(area, index) => (
              <div class="flex gap-2">
                <input
                  type="text"
                  value={area}
                  onInput={(e) => updateArea(index(), e.currentTarget.value)}
                  placeholder="e.g., Main Building Floor 2, Parking Lot"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <Show when={areasInspected().length > 1}>
                  <button
                    type="button"
                    onClick={() => removeArea(index())}
                    class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                  >
                    Remove
                  </button>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Safety Checklist */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Safety Checklist</h3>

        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-900">
            <strong>Violations Found:</strong> {calculateViolations()} |
            <strong class="ml-2">Overall Status:</strong>
            <span class={`ml-1 font-semibold ${
              calculateOverallStatus() === 'pass' ? 'text-green-600' :
              calculateOverallStatus() === 'fail' ? 'text-red-600' : 'text-orange-600'
            }`}>
              {calculateOverallStatus().toUpperCase()}
            </span>
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pass</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fail</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">N/A</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <For each={checklistItems()}>
                {(item, index) => (
                  <tr class={item.status === 'fail' ? 'bg-red-50' : ''}>
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">{item.category}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">{item.item}</td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`status-${index()}`}
                        checked={item.status === 'pass'}
                        onChange={() => updateChecklistItem(index(), 'status', 'pass')}
                        class="w-4 h-4 text-green-600"
                      />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`status-${index()}`}
                        checked={item.status === 'fail'}
                        onChange={() => updateChecklistItem(index(), 'status', 'fail')}
                        class="w-4 h-4 text-red-600"
                      />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`status-${index()}`}
                        checked={item.status === 'na'}
                        onChange={() => updateChecklistItem(index(), 'status', 'na')}
                        class="w-4 h-4 text-gray-600"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <input
                        type="text"
                        value={item.notes}
                        onInput={(e) => updateChecklistItem(index(), 'notes', e.currentTarget.value)}
                        placeholder="Add notes if needed"
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                      />
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>

      {/* Corrective Actions */}
      <Show when={calculateViolations() > 0}>
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-orange-900">Corrective Actions Required</h3>
            <button
              type="button"
              onClick={addCorrectiveAction}
              class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              + Add Corrective Action
            </button>
          </div>

          <Show when={correctiveActions().length === 0}>
            <p class="text-sm text-orange-700">
              {calculateViolations()} violation(s) found. Please add corrective actions.
            </p>
          </Show>

          <div class="space-y-3">
            <For each={correctiveActions()}>
              {(action, index) => (
                <div class="bg-white p-4 rounded-lg border border-orange-300">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div class="md:col-span-2">
                      <label class="block text-xs font-medium text-gray-700 mb-1">Issue Description</label>
                      <input
                        type="text"
                        value={action.issue}
                        onInput={(e) => updateCorrectiveAction(index(), 'issue', e.currentTarget.value)}
                        placeholder="Describe the safety violation"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div class="md:col-span-2">
                      <label class="block text-xs font-medium text-gray-700 mb-1">Corrective Action</label>
                      <input
                        type="text"
                        value={action.action}
                        onInput={(e) => updateCorrectiveAction(index(), 'action', e.currentTarget.value)}
                        placeholder="What needs to be done to fix this"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                      <input
                        type="text"
                        value={action.assignedTo}
                        onInput={(e) => updateCorrectiveAction(index(), 'assignedTo', e.currentTarget.value)}
                        placeholder="Person responsible"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={action.dueDate}
                        onInput={(e) => updateCorrectiveAction(index(), 'dueDate', e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCorrectiveAction(index())}
                    class="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Action
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Additional Comments */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Additional Comments</h3>
        <textarea
          value={comments()}
          onInput={(e) => setComments(e.currentTarget.value)}
          rows={4}
          placeholder="Any additional observations or notes..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        />
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
          class="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
          disabled={isSubmitting()}
        >
          {isSubmitting() ? 'Saving...' : 'Save Inspection'}
        </button>
      </div>
    </form>
  );
}
