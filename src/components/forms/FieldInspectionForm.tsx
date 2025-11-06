/**
 * Field Inspection Form
 * Track code inspections, quality checks, and punch list items
 */
import { createSignal, For, Show } from 'solid-js';

interface FieldInspectionFormProps {
  projectId: number;
  inspectionNumber?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Finding {
  item: string;
  status: 'passed' | 'failed' | 'conditional';
  notes: string;
  actionRequired: boolean;
}

export default function FieldInspectionForm(props: FieldInspectionFormProps) {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  // Basic info
  const [inspectionDate, setInspectionDate] = createSignal('');
  const [inspectionTime, setInspectionTime] = createSignal('');
  const [inspectionType, setInspectionType] = createSignal('foundation');
  const [area, setArea] = createSignal('');
  const [specificLocation, setSpecificLocation] = createSignal('');

  // Inspector info
  const [inspectorName, setInspectorName] = createSignal('');
  const [inspectorCompany, setInspectorCompany] = createSignal('');
  const [inspectorLicense, setInspectorLicense] = createSignal('');

  // Scope
  const [scopeOfInspection, setScopeOfInspection] = createSignal('');
  const [workInspected, setWorkInspected] = createSignal('');
  const [contractorPresent, setContractorPresent] = createSignal('');

  // Results
  const [findings, setFindings] = createSignal<Finding[]>([
    { item: '', status: 'passed', notes: '', actionRequired: false }
  ]);
  const [inspectorNotes, setInspectorNotes] = createSignal('');
  const [contractorNotes, setContractorNotes] = createSignal('');
  const [requiresReinspection, setRequiresReinspection] = createSignal(false);
  const [reinspectionDate, setReinspectionDate] = createSignal('');

  const addFinding = () => {
    setFindings([...findings(), { item: '', status: 'passed', notes: '', actionRequired: false }]);
  };

  const updateFinding = (index: number, field: keyof Finding, value: any) => {
    const updated = [...findings()];
    updated[index] = { ...updated[index], [field]: value };
    setFindings(updated);
  };

  const removeFinding = (index: number) => {
    setFindings(findings().filter((_, i) => i !== index));
  };

  const calculateStatus = () => {
    const allFindings = findings().filter(f => f.item);
    if (allFindings.length === 0) return 'pending';
    const hasFailed = allFindings.some(f => f.status === 'failed');
    const hasConditional = allFindings.some(f => f.status === 'conditional');
    if (hasFailed) return 'failed';
    if (hasConditional) return 'conditional';
    return 'passed';
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

    if (!area()) {
      setError('Inspection area is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const validFindings = findings().filter(f => f.item);
      const passedItems = validFindings.filter(f => f.status === 'passed').length;
      const failedItems = validFindings.filter(f => f.status === 'failed').length;

      const inspectionData = {
        projectId: props.projectId,
        inspectionNumber: props.inspectionNumber || `FI-${Date.now()}`,
        inspectionType: inspectionType(),
        inspectionDate: new Date(inspectionDate()).toISOString(),
        inspectionTime: inspectionTime(),

        // Location
        area: area(),
        specificLocation: specificLocation(),

        // Inspector
        inspectorName: inspectorName(),
        inspectorCompany: inspectorCompany(),
        inspectorLicense: inspectorLicense(),

        // Scope
        scopeOfInspection: scopeOfInspection(),
        workInspected: workInspected(),
        contractorPresent: contractorPresent(),

        // Results
        findings: validFindings,
        status: calculateStatus(),
        passedItems,
        failedItems,
        deficienciesFound: failedItems,

        // Notes
        inspectorNotes: inspectorNotes(),
        contractorNotes: contractorNotes(),

        // Follow-up
        requiresReinspection: requiresReinspection(),
        reinspectionDate: reinspectionDate() ? new Date(reinspectionDate()).toISOString() : null,
      };

      const response = await fetch('/api/field/inspections', {
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
      {/* Header */}
      <div class="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-lg">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-semibold text-purple-900">Field Inspection Report</h3>
            <p class="text-sm text-purple-800 mt-1">
              Document code inspections, quality checks, and punch list items
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
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Inspection Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Inspection Date *</label>
            <input
              type="date"
              value={inspectionDate()}
              onInput={(e) => setInspectionDate(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Time</label>
            <input
              type="time"
              value={inspectionTime()}
              onInput={(e) => setInspectionTime(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Inspection Type *</label>
            <select
              value={inspectionType()}
              onInput={(e) => setInspectionType(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="foundation">Foundation</option>
              <option value="framing">Framing</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
              <option value="drywall">Drywall</option>
              <option value="final">Final</option>
              <option value="punch_list">Punch List</option>
              <option value="code_compliance">Code Compliance</option>
              <option value="disd_safety">DISD Safety</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Area/Building *</label>
            <input
              type="text"
              value={area()}
              onInput={(e) => setArea(e.currentTarget.value)}
              placeholder="e.g., Building A - 2nd Floor"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-300 mb-1">Specific Location</label>
            <input
              type="text"
              value={specificLocation()}
              onInput={(e) => setSpecificLocation(e.currentTarget.value)}
              placeholder="Detailed location description"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Inspector Information */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Inspector Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Inspector Name *</label>
            <input
              type="text"
              value={inspectorName()}
              onInput={(e) => setInspectorName(e.currentTarget.value)}
              placeholder="Inspector name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Company/Agency</label>
            <input
              type="text"
              value={inspectorCompany()}
              onInput={(e) => setInspectorCompany(e.currentTarget.value)}
              placeholder="e.g., City Building Dept"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">License Number</label>
            <input
              type="text"
              value={inspectorLicense()}
              onInput={(e) => setInspectorLicense(e.currentTarget.value)}
              placeholder="License/certification #"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Scope of Inspection */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Scope & Work Inspected</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Scope of Inspection</label>
            <textarea
              value={scopeOfInspection()}
              onInput={(e) => setScopeOfInspection(e.currentTarget.value)}
              rows={3}
              placeholder="What is being inspected..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Work Inspected</label>
            <textarea
              value={workInspected()}
              onInput={(e) => setWorkInspected(e.currentTarget.value)}
              rows={3}
              placeholder="Description of work that was inspected..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Contractor Representative Present</label>
            <input
              type="text"
              value={contractorPresent()}
              onInput={(e) => setContractorPresent(e.currentTarget.value)}
              placeholder="Name of contractor representative"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Inspection Findings */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-white">Inspection Findings</h3>
          <button
            type="button"
            onClick={addFinding}
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            + Add Finding
          </button>
        </div>

        <div class="space-y-3">
          <For each={findings()}>
            {(finding, index) => (
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-700">
                <div class="grid grid-cols-1 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-300 mb-1">Item Inspected</label>
                    <input
                      type="text"
                      value={finding.item}
                      onInput={(e) => updateFinding(index(), 'item', e.currentTarget.value)}
                      placeholder="e.g., Foundation wall reinforcement"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-300 mb-1">Status</label>
                      <select
                        value={finding.status}
                        onInput={(e) => updateFinding(index(), 'status', e.currentTarget.value)}
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="conditional">Conditional</option>
                      </select>
                    </div>

                    <div class="flex items-center">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={finding.actionRequired}
                          onChange={(e) => updateFinding(index(), 'actionRequired', e.currentTarget.checked)}
                          class="w-4 h-4 text-purple-600 rounded"
                        />
                        <span class="text-sm font-medium text-gray-300">Action Required</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-300 mb-1">Notes</label>
                    <textarea
                      value={finding.notes}
                      onInput={(e) => updateFinding(index(), 'notes', e.currentTarget.value)}
                      rows={2}
                      placeholder="Notes about this finding..."
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFinding(index())}
                    class="text-sm text-red-600 hover:text-red-800 text-left"
                  >
                    Remove Finding
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Inspection Result */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Result & Follow-Up</h3>

        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-300">Overall Status:</span>
            <span class={`px-3 py-1 rounded-full text-sm font-semibold ${
              calculateStatus() === 'passed' ? 'bg-green-100 text-green-800' :
              calculateStatus() === 'failed' ? 'bg-red-100 text-red-800' :
              calculateStatus() === 'conditional' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {calculateStatus().toUpperCase()}
            </span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Inspector Notes</label>
            <textarea
              value={inspectorNotes()}
              onInput={(e) => setInspectorNotes(e.currentTarget.value)}
              rows={3}
              placeholder="Inspector's notes and comments..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Contractor Notes</label>
            <textarea
              value={contractorNotes()}
              onInput={(e) => setContractorNotes(e.currentTarget.value)}
              rows={3}
              placeholder="Contractor's response or notes..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresReinspection()}
                onChange={(e) => setRequiresReinspection(e.currentTarget.checked)}
                class="w-4 h-4 text-purple-600 rounded"
              />
              <span class="text-sm font-medium text-gray-300">Requires Reinspection</span>
            </label>

            <Show when={requiresReinspection()}>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-300 mb-1">Reinspection Date</label>
                <input
                  type="date"
                  value={reinspectionDate()}
                  onInput={(e) => setReinspectionDate(e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div class="flex justify-end gap-3 pt-6 border-t border-gray-700">
        <Show when={props.onCancel}>
          <button
            type="button"
            onClick={props.onCancel}
            class="px-6 py-2.5 border border-gray-300 text-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            disabled={isSubmitting()}
          >
            Cancel
          </button>
        </Show>
        <button
          type="submit"
          class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
          disabled={isSubmitting()}
        >
          {isSubmitting() ? 'Saving...' : 'Save Inspection'}
        </button>
      </div>
    </form>
  );
}
