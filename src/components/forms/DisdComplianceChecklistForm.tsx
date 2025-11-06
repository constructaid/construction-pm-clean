/**
 * DISD Compliance Checklist Form
 * Daily/Weekly compliance verification for DISD school projects
 */
import { createSignal, Show } from 'solid-js';

interface DisdComplianceChecklistFormProps {
  projectId: number;
  checklistNumber?: string;
  checklistType?: 'daily' | 'weekly' | 'monthly';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DisdComplianceChecklistForm(props: DisdComplianceChecklistFormProps) {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  // Form fields
  const [checklistDate, setChecklistDate] = createSignal('');
  const [checklistType, setChecklistType] = createSignal(props.checklistType || 'daily');
  const [completedBy, setCompletedBy] = createSignal('');
  const [completedByRole, setCompletedByRole] = createSignal('Field Superintendent');

  // Safety Compliance
  const [safetyMeetingCurrent, setSafetyMeetingCurrent] = createSignal(false);
  const [safetyInspectionCurrent, setSafetyInspectionCurrent] = createSignal(false);
  const [allWorkersBadged, setAllWorkersBadged] = createSignal(false);
  const [ppeCompliance, setPpeCompliance] = createSignal(false);
  const [emergencyContactsPosted, setEmergencyContactsPosted] = createSignal(false);

  // Site Compliance
  const [siteClean, setSiteClean] = createSignal(false);
  const [barricadesProper, setBarricadesProper] = createSignal(false);
  const [signageCompliant, setSignageCompliant] = createSignal(false);
  const [fireExtinguishersChecked, setFireExtinguishersChecked] = createSignal(false);
  const [firstAidKitStocked, setFirstAidKitStocked] = createSignal(false);

  // Documentation Compliance
  const [dailyReportSubmitted, setDailyReportSubmitted] = createSignal(false);
  const [permitsCurrent, setPermitsCurrent] = createSignal(false);
  const [insuranceCurrent, setInsuranceCurrent] = createSignal(false);
  const [trainingRecordsCurrent, setTrainingRecordsCurrent] = createSignal(false);

  // Work Area Compliance
  const [scaffoldInspected, setScaffoldInspected] = createSignal(false);
  const [laddersInspected, setLaddersInspected] = createSignal(false);
  const [electricalSafe, setElectricalSafe] = createSignal(false);
  const [excavationsSafe, setExcavationsSafe] = createSignal(false);
  const [fallProtectionInPlace, setFallProtectionInPlace] = createSignal(false);

  // Issues and notes
  const [issues, setIssues] = createSignal('');
  const [correctiveActions, setCorrectiveActions] = createSignal('');
  const [notes, setNotes] = createSignal('');

  const calculateComplianceScore = () => {
    const checks = [
      safetyMeetingCurrent(),
      safetyInspectionCurrent(),
      allWorkersBadged(),
      ppeCompliance(),
      emergencyContactsPosted(),
      siteClean(),
      barricadesProper(),
      signageCompliant(),
      fireExtinguishersChecked(),
      firstAidKitStocked(),
      dailyReportSubmitted(),
      permitsCurrent(),
      insuranceCurrent(),
      trainingRecordsCurrent(),
      scaffoldInspected(),
      laddersInspected(),
      electricalSafe(),
      excavationsSafe(),
      fallProtectionInPlace(),
    ];

    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c).length;
    return Math.round((passedChecks / totalChecks) * 100);
  };

  const getComplianceStatus = (score: number) => {
    if (score >= 95) return 'compliant';
    if (score >= 80) return 'requires_attention';
    return 'non_compliant';
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!checklistDate()) {
      setError('Checklist date is required');
      return;
    }

    if (!completedBy()) {
      setError('Completed by name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const complianceScore = calculateComplianceScore();
      const complianceStatus = getComplianceStatus(complianceScore);

      const checklistData = {
        projectId: props.projectId,
        checklistNumber: props.checklistNumber || `DC-${Date.now()}`,
        checklistDate: new Date(checklistDate()).toISOString(),
        checklistType: checklistType(),
        completedBy: completedBy(),
        completedByRole: completedByRole(),

        // Safety compliance
        safetyMeetingCurrent: safetyMeetingCurrent(),
        safetyInspectionCurrent: safetyInspectionCurrent(),
        allWorkersBadged: allWorkersBadged(),
        ppeCompliance: ppeCompliance(),
        emergencyContactsPosted: emergencyContactsPosted(),

        // Site compliance
        siteClean: siteClean(),
        barricadesProper: barricadesProper(),
        signageCompliant: signageCompliant(),
        fireExtinguishersChecked: fireExtinguishersChecked(),
        firstAidKitStocked: firstAidKitStocked(),

        // Documentation compliance
        dailyReportSubmitted: dailyReportSubmitted(),
        permitsCurrent: permitsCurrent(),
        insuranceCurrent: insuranceCurrent(),
        trainingRecordsCurrent: trainingRecordsCurrent(),

        // Work area compliance
        scaffoldInspected: scaffoldInspected(),
        laddersInspected: laddersInspected(),
        electricalSafe: electricalSafe(),
        excavationsSafe: excavationsSafe(),
        fallProtectionInPlace: fallProtectionInPlace(),

        // Issues and actions
        issuesIdentified: issues() ? issues().split('\n').filter(i => i.trim()) : [],
        correctiveActions: correctiveActions() ? correctiveActions().split('\n').filter(a => a.trim()) : [],

        // Overall compliance
        overallCompliance: complianceStatus,
        complianceScore: complianceScore,

        notes: notes(),
      };

      const response = await fetch('/api/field/compliance-checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checklistData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save compliance checklist');
      }

      if (props.onSuccess) {
        props.onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save compliance checklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CheckboxField = (props: { label: string; checked: boolean; onChange: (val: boolean) => void; critical?: boolean }) => (
    <label class={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
      props.checked ? 'bg-green-900/30 border-green-500' : 'bg-gray-900 border-gray-600 hover:bg-gray-800'
    } ${props.critical && !props.checked ? 'border-red-500 bg-red-900/20' : ''}`}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
        class="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
      />
      <span class="flex-1 text-sm font-medium text-gray-200">
        {props.label}
        {props.critical && <span class="text-red-400 ml-1">*</span>}
      </span>
      <Show when={props.checked}>
        <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </Show>
    </label>
  );

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {/* Header */}
      <div class="bg-green-50 border-l-4 border-green-600 p-4 rounded-lg">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-semibold text-green-900">DISD Compliance Checklist</h3>
            <p class="text-sm text-green-800 mt-1">
              Daily/Weekly verification of DISD safety and site compliance requirements
            </p>
          </div>
        </div>
      </div>

      <Show when={error()}>
        <div class="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <p class="text-sm text-red-800">{error()}</p>
        </div>
      </Show>

      {/* Compliance Score Preview */}
      <div class="bg-gray-800 border-2 border-blue-500 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-semibold text-white">Compliance Score</h4>
            <p class="text-sm text-gray-400">Based on completed items</p>
          </div>
          <div class="text-center">
            <div class={`text-4xl font-bold ${
              calculateComplianceScore() >= 95 ? 'text-green-400' :
              calculateComplianceScore() >= 80 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {calculateComplianceScore()}%
            </div>
            <div class="text-xs text-gray-400 mt-1">
              {calculateComplianceScore() >= 95 ? 'Compliant' :
               calculateComplianceScore() >= 80 ? 'Needs Attention' : 'Non-Compliant'}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Checklist Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Checklist Date *</label>
            <input
              type="date"
              value={checklistDate()}
              onInput={(e) => setChecklistDate(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Checklist Type</label>
            <select
              value={checklistType()}
              onInput={(e) => setChecklistType(e.currentTarget.value as any)}
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Completed By *</label>
            <input
              type="text"
              value={completedBy()}
              onInput={(e) => setCompletedBy(e.currentTarget.value)}
              placeholder="Your name"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <input
              type="text"
              value={completedByRole()}
              onInput={(e) => setCompletedByRole(e.currentTarget.value)}
              placeholder="e.g., Field Superintendent"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Safety Compliance Section */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🦺</span>
          <h3 class="text-lg font-semibold text-white">DISD Safety Compliance</h3>
        </div>
        <div class="space-y-2">
          <CheckboxField
            label="Weekly safety meeting conducted (within last 7 days)"
            checked={safetyMeetingCurrent()}
            onChange={setSafetyMeetingCurrent}
            critical
          />
          <CheckboxField
            label="Daily safety inspection completed"
            checked={safetyInspectionCurrent()}
            onChange={setSafetyInspectionCurrent}
            critical
          />
          <CheckboxField
            label="All workers have DISD badges displayed"
            checked={allWorkersBadged()}
            onChange={setAllWorkersBadged}
            critical
          />
          <CheckboxField
            label="PPE compliance - all workers properly equipped"
            checked={ppeCompliance()}
            onChange={setPpeCompliance}
            critical
          />
          <CheckboxField
            label="Emergency contact information posted (Bond Safety Director: 214-435-2204)"
            checked={emergencyContactsPosted()}
            onChange={setEmergencyContactsPosted}
            critical
          />
        </div>
      </div>

      {/* Site Compliance Section */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🏗️</span>
          <h3 class="text-lg font-semibold text-white">Site Conditions</h3>
        </div>
        <div class="space-y-2">
          <CheckboxField
            label="Site is clean and organized - housekeeping maintained"
            checked={siteClean()}
            onChange={setSiteClean}
          />
          <CheckboxField
            label="Barricades and fencing properly installed and maintained"
            checked={barricadesProper()}
            onChange={setBarricadesProper}
          />
          <CheckboxField
            label="All required signage in place and visible"
            checked={signageCompliant()}
            onChange={setSignageCompliant}
          />
          <CheckboxField
            label="Fire extinguishers checked and accessible"
            checked={fireExtinguishersChecked()}
            onChange={setFireExtinguishersChecked}
          />
          <CheckboxField
            label="First aid kit stocked and accessible"
            checked={firstAidKitStocked()}
            onChange={setFirstAidKitStocked}
          />
        </div>
      </div>

      {/* Documentation Compliance Section */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">📋</span>
          <h3 class="text-lg font-semibold text-white">Documentation & Records</h3>
        </div>
        <div class="space-y-2">
          <CheckboxField
            label="Daily field report submitted"
            checked={dailyReportSubmitted()}
            onChange={setDailyReportSubmitted}
          />
          <CheckboxField
            label="All work permits current and posted"
            checked={permitsCurrent()}
            onChange={setPermitsCurrent}
          />
          <CheckboxField
            label="Insurance certificates current and on file"
            checked={insuranceCurrent()}
            onChange={setInsuranceCurrent}
          />
          <CheckboxField
            label="Worker training records up to date"
            checked={trainingRecordsCurrent()}
            onChange={setTrainingRecordsCurrent}
          />
        </div>
      </div>

      {/* Work Area Compliance Section */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">⚠️</span>
          <h3 class="text-lg font-semibold text-white">Work Area Safety</h3>
        </div>
        <div class="space-y-2">
          <CheckboxField
            label="Scaffolding inspected and tagged (if in use)"
            checked={scaffoldInspected()}
            onChange={setScaffoldInspected}
          />
          <CheckboxField
            label="Ladders inspected and properly secured"
            checked={laddersInspected()}
            onChange={setLaddersInspected}
          />
          <CheckboxField
            label="Electrical cords and equipment safe and compliant"
            checked={electricalSafe()}
            onChange={setElectricalSafe}
          />
          <CheckboxField
            label="Excavations/trenches properly protected and sloped"
            checked={excavationsSafe()}
            onChange={setExcavationsSafe}
          />
          <CheckboxField
            label="Fall protection systems in place where required"
            checked={fallProtectionInPlace()}
            onChange={setFallProtectionInPlace}
          />
        </div>
      </div>

      {/* Issues and Corrective Actions */}
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h3 class="text-lg font-semibold text-white">Issues & Corrective Actions</h3>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Issues Identified</label>
          <textarea
            value={issues()}
            onInput={(e) => setIssues(e.currentTarget.value)}
            rows={4}
            placeholder="List any compliance issues or concerns (one per line)..."
            class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
          />
          <p class="text-xs text-gray-400 mt-1">Enter each issue on a new line</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Corrective Actions Taken</label>
          <textarea
            value={correctiveActions()}
            onInput={(e) => setCorrectiveActions(e.currentTarget.value)}
            rows={4}
            placeholder="List corrective actions for each issue (one per line)..."
            class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
          />
          <p class="text-xs text-gray-400 mt-1">Enter each action on a new line</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Additional Notes</label>
          <textarea
            value={notes()}
            onInput={(e) => setNotes(e.currentTarget.value)}
            rows={3}
            placeholder="Any additional notes or comments..."
            class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div class="flex justify-end gap-3 pt-6 border-t border-gray-700">
        <Show when={props.onCancel}>
          <button
            type="button"
            onClick={props.onCancel}
            class="px-6 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition font-medium"
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
          {isSubmitting() ? 'Saving...' : 'Save Compliance Checklist'}
        </button>
      </div>
    </form>
  );
}
