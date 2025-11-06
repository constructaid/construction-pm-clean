/**
 * Field Superintendent Dashboard
 * Comprehensive dashboard for DISD project superintendents
 * Tracks compliance, coordinates activities, manages forms and logs
 */
import { createSignal, onMount, Show, For } from 'solid-js';
import DailyReportForm from './field-reports/DailyReportForm';
import DisdComplianceChecklistForm from './forms/DisdComplianceChecklistForm';
import FieldInspectionForm from './forms/FieldInspectionForm';
import MaterialDeliveryForm from './forms/MaterialDeliveryForm';
import SafetyInspectionForm from './forms/SafetyInspectionForm';
import SubcontractorCoordination from './field-reports/SubcontractorCoordination';

interface FieldSuperintendentDashboardProps {
  projectId: number;
}

type DashboardModule =
  | 'overview'
  | 'daily-report'
  | 'compliance-checklist'
  | 'safety-inspection'
  | 'field-inspection'
  | 'material-deliveries'
  | 'sub-coordination'
  | 'action-items'
  | 'documentation';

export default function FieldSuperintendentDashboard(props: FieldSuperintendentDashboardProps) {
  const [activeModule, setActiveModule] = createSignal<DashboardModule>('overview');
  const [project, setProject] = createSignal<any>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [stats, setStats] = createSignal<any>({
    dailyReports: { thisWeek: 0, pending: 0, lastSubmitted: null },
    compliance: { score: 0, issues: 0, lastChecklist: null },
    inspections: { thisWeek: 0, pending: 0, failed: 0 },
    deliveries: { today: 0, thisWeek: 0, scheduled: 0 },
    subcontractors: { onSite: 0, scheduled: 0, pending: 0 },
    actionItems: { open: 0, dueToday: 0, overdue: 0 },
  });

  onMount(async () => {
    await loadProjectData();
    await loadFieldStats();
  });

  const loadProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.project) {
          setProject(data.data.project);
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFieldStats = async () => {
    try {
      const response = await fetch(`/api/field/stats?projectId=${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load field stats:', err);
    }
  };

  const modules = [
    {
      id: 'overview' as DashboardModule,
      name: 'Overview',
      icon: '📊',
      description: 'Field operations overview and compliance status'
    },
    {
      id: 'daily-report' as DashboardModule,
      name: 'Daily Report',
      icon: '📝',
      description: 'Daily field reports and activity logs'
    },
    {
      id: 'compliance-checklist' as DashboardModule,
      name: 'DISD Compliance',
      icon: '✅',
      description: 'Daily/Weekly DISD compliance checklists'
    },
    {
      id: 'safety-inspection' as DashboardModule,
      name: 'Safety Inspections',
      icon: '🦺',
      description: 'DISD safety inspections and violations'
    },
    {
      id: 'field-inspection' as DashboardModule,
      name: 'Field Inspections',
      icon: '🔍',
      description: 'Code inspections and punch lists'
    },
    {
      id: 'material-deliveries' as DashboardModule,
      name: 'Material Coordination',
      icon: '🚚',
      description: 'Material deliveries and logistics'
    },
    {
      id: 'sub-coordination' as DashboardModule,
      name: 'Sub Coordination',
      icon: '👷',
      description: 'Subcontractor coordination and scheduling'
    },
    {
      id: 'action-items' as DashboardModule,
      name: 'Action Items',
      icon: '⚡',
      description: 'Superintendent notes and action items'
    },
    {
      id: 'documentation' as DashboardModule,
      name: 'Documentation',
      icon: '📂',
      description: 'Forms, logs, and reports'
    },
  ];

  const renderOverview = () => {
    const currentStats = stats();

    return (
      <div class="space-y-6">
        {/* DISD Project Banner */}
        <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-2xl font-bold mb-2">Field Superintendent Dashboard</h2>
              <p class="text-blue-100">
                <Show when={project()}>
                  {project().name} - {project().projectNumber}
                </Show>
              </p>
              <p class="text-sm text-blue-200 mt-1">DISD School Construction Project</p>
            </div>
            <div class="bg-gray-800/20 rounded-lg p-4 backdrop-blur-sm">
              <div class="text-center">
                <div class="text-3xl font-bold">{currentStats.compliance.score}%</div>
                <div class="text-sm text-blue-100 mt-1">Compliance Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Actions Banner */}
        <Show when={currentStats.actionItems.overdue > 0 || currentStats.compliance.issues > 0}>
          <div class="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
            <div class="flex items-start">
              <svg class="h-6 w-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-semibold text-red-900">Action Required</h3>
                <div class="mt-2 text-sm text-red-800 space-y-1">
                  <Show when={currentStats.actionItems.overdue > 0}>
                    <p>• {currentStats.actionItems.overdue} overdue action item(s)</p>
                  </Show>
                  <Show when={currentStats.compliance.issues > 0}>
                    <p>• {currentStats.compliance.issues} compliance issue(s) need attention</p>
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Key Metrics */}
        <div>
          <h3 class="text-lg font-bold text-white mb-4">Daily Operations</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Reports */}
            <div class="bg-gray-800 border-l-4 border-blue-500 rounded-lg shadow-lg p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">📝</span>
                  <h4 class="font-semibold text-white">Daily Reports</h4>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">This Week:</span>
                  <span class="font-semibold text-white">{currentStats.dailyReports.thisWeek}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Pending:</span>
                  <span class={`font-semibold ${currentStats.dailyReports.pending > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                    {currentStats.dailyReports.pending}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('daily-report')}
                class="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Create Report
              </button>
            </div>

            {/* DISD Compliance */}
            <div class="bg-gray-800 border-l-4 border-green-500 rounded-lg shadow-lg p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">✅</span>
                  <h4 class="font-semibold text-white">DISD Compliance</h4>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Score:</span>
                  <span class="font-semibold text-green-400">{currentStats.compliance.score}%</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Issues:</span>
                  <span class={`font-semibold ${currentStats.compliance.issues > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {currentStats.compliance.issues}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('compliance-checklist')}
                class="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                Daily Checklist
              </button>
            </div>

            {/* Inspections */}
            <div class="bg-gray-800 border-l-4 border-purple-500 rounded-lg shadow-lg p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">🔍</span>
                  <h4 class="font-semibold text-white">Inspections</h4>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">This Week:</span>
                  <span class="font-semibold text-white">{currentStats.inspections.thisWeek}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Pending:</span>
                  <span class={`font-semibold ${currentStats.inspections.pending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {currentStats.inspections.pending}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('field-inspection')}
                class="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                Log Inspection
              </button>
            </div>

            {/* Material Deliveries */}
            <div class="bg-gray-800 border-l-4 border-orange-500 rounded-lg shadow-lg p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">🚚</span>
                  <h4 class="font-semibold text-white">Deliveries</h4>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Today:</span>
                  <span class="font-semibold text-white">{currentStats.deliveries.today}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Scheduled:</span>
                  <span class="font-semibold text-blue-600">{currentStats.deliveries.scheduled}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('material-deliveries')}
                class="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
              >
                View Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Coordination & Action Items */}
        <div>
          <h3 class="text-lg font-bold text-white mb-4">Coordination & Tasks</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subcontractor Coordination */}
            <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-5">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">👷</span>
                <div>
                  <h4 class="font-semibold text-white">Subcontractor Coordination</h4>
                  <p class="text-xs text-gray-400">Schedule and coordinate trades</p>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">{currentStats.subcontractors.onSite}</div>
                  <div class="text-xs text-gray-400">On Site</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{currentStats.subcontractors.scheduled}</div>
                  <div class="text-xs text-gray-400">Scheduled</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-orange-600">{currentStats.subcontractors.pending}</div>
                  <div class="text-xs text-gray-400">Pending</div>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('sub-coordination')}
                class="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                Manage Coordination
              </button>
            </div>

            {/* Action Items */}
            <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-5">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">⚡</span>
                <div>
                  <h4 class="font-semibold text-white">Action Items & Notes</h4>
                  <p class="text-xs text-gray-400">Track follow-ups and tasks</p>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-white">{currentStats.actionItems.open}</div>
                  <div class="text-xs text-gray-400">Open</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-orange-600">{currentStats.actionItems.dueToday}</div>
                  <div class="text-xs text-gray-400">Due Today</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-red-600">{currentStats.actionItems.overdue}</div>
                  <div class="text-xs text-gray-400">Overdue</div>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('action-items')}
                class="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                View Action Items
              </button>
            </div>
          </div>
        </div>

        {/* Quick Access Tools */}
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-700">
          <h3 class="text-lg font-bold text-white mb-4">Quick Access</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveModule('daily-report')}
              class="px-4 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition shadow-lg font-medium text-sm border border-blue-200"
            >
              + Daily Report
            </button>
            <button
              onClick={() => setActiveModule('compliance-checklist')}
              class="px-4 py-3 bg-white text-green-700 rounded-lg hover:bg-green-50 transition shadow-lg font-medium text-sm border border-green-200"
            >
              + Compliance Check
            </button>
            <button
              onClick={() => setActiveModule('safety-inspection')}
              class="px-4 py-3 bg-white text-red-700 rounded-lg hover:bg-red-50 transition shadow-lg font-medium text-sm border border-red-200"
            >
              + Safety Inspection
            </button>
            <button
              onClick={() => setActiveModule('material-deliveries')}
              class="px-4 py-3 bg-white text-orange-700 rounded-lg hover:bg-orange-50 transition shadow-lg font-medium text-sm border border-orange-200"
            >
              + Log Delivery
            </button>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div class="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-semibold text-red-900">DISD Emergency Contacts</h3>
              <div class="mt-2 text-sm text-red-800 space-y-1">
                <p><strong>Bond Safety Director:</strong> 214-435-2204</p>
                <p><strong>Emergency:</strong> 911</p>
                <p class="text-xs mt-2">Contact immediately for all serious incidents, injuries, or safety emergencies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModulePlaceholder = (moduleName: string, description: string) => {
    return (
      <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-12 text-center">
        <div class="max-w-md mx-auto">
          <div class="text-6xl mb-4">🚧</div>
          <h3 class="text-xl font-bold text-white mb-2">{moduleName}</h3>
          <p class="text-gray-300 mb-6">{description}</p>
          <p class="text-sm text-gray-400 mb-6">
            This module will include forms, logs, and tracking for {moduleName.toLowerCase()}.
          </p>
          <button
            onClick={() => setActiveModule('overview')}
            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Overview
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Show when={isLoading()}>
        <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-gray-400 mt-2">Loading field superintendent dashboard...</p>
        </div>
      </Show>

      <Show when={!isLoading()}>
        {/* Module Navigation */}
        <div class="bg-gray-800 rounded-t-lg shadow-lg border border-gray-700 border-b-0 overflow-x-auto">
          <div class="flex gap-1 p-2 min-w-max">
            <For each={modules}>
              {(module) => (
                <button
                  onClick={() => setActiveModule(module.id)}
                  class={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap ${
                    activeModule() === module.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                  title={module.description}
                >
                  <span>{module.icon}</span>
                  <span>{module.name}</span>
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Module Content */}
        <div class="bg-gray-800 rounded-b-lg shadow-lg border border-gray-700 p-6">
          <Show when={activeModule() === 'overview'}>
            {renderOverview()}
          </Show>

          <Show when={activeModule() === 'daily-report'}>
            <DailyReportForm
              projectId={props.projectId}
              reportNumber={`DR-${new Date().toISOString().split('T')[0]}`}
              onSuccess={() => {
                loadFieldStats();
                setActiveModule('overview');
              }}
              onCancel={() => setActiveModule('overview')}
            />
          </Show>

          <Show when={activeModule() === 'compliance-checklist'}>
            <DisdComplianceChecklistForm
              projectId={props.projectId}
              checklistNumber={`DC-${new Date().toISOString().split('T')[0]}`}
              checklistType="daily"
              onSuccess={() => {
                loadFieldStats();
                setActiveModule('overview');
              }}
              onCancel={() => setActiveModule('overview')}
            />
          </Show>

          <Show when={activeModule() === 'safety-inspection'}>
            <SafetyInspectionForm
              projectId={props.projectId}
              onSuccess={() => {
                loadFieldStats();
                setActiveModule('overview');
              }}
              onCancel={() => setActiveModule('overview')}
            />
          </Show>

          <Show when={activeModule() === 'field-inspection'}>
            <FieldInspectionForm
              projectId={props.projectId}
              inspectionNumber={`FI-${Date.now()}`}
              onSuccess={() => {
                loadFieldStats();
                setActiveModule('overview');
              }}
              onCancel={() => setActiveModule('overview')}
            />
          </Show>

          <Show when={activeModule() === 'material-deliveries'}>
            <MaterialDeliveryForm
              projectId={props.projectId}
              deliveryNumber={`MD-${Date.now()}`}
              onSuccess={() => {
                loadFieldStats();
                setActiveModule('overview');
              }}
              onCancel={() => setActiveModule('overview')}
            />
          </Show>

          <Show when={activeModule() === 'sub-coordination'}>
            <SubcontractorCoordination projectId={props.projectId} />
          </Show>

          <Show when={activeModule() === 'action-items'}>
            {renderModulePlaceholder('Superintendent Action Items', 'Track notes, action items, follow-ups, and critical tasks.')}
          </Show>

          <Show when={activeModule() === 'documentation'}>
            {renderModulePlaceholder('Field Documentation', 'Access all field forms, logs, reports, and documentation in one place.')}
          </Show>
        </div>
      </Show>
    </div>
  );
}
