/**
 * Safety Manager Component
 * DISD Safety Management System - Dashboard and Module Router
 */
import { createSignal, onMount, Show, For } from 'solid-js';
import SafetyMeetingLog from './SafetyMeetingLog';
import SafetyMeetingForm from './forms/SafetyMeetingForm';
import SafetyTimeline from './SafetyTimeline';

interface SafetyManagerProps {
  projectId: number;
}

type SafetyModule =
  | 'dashboard'
  | 'timeline'
  | 'action-plans'
  | 'meetings'
  | 'inspections'
  | 'incidents'
  | 'jha'
  | 'permits'
  | 'crane-inspections'
  | 'training'
  | 'certifications';

export default function SafetyManager(props: SafetyManagerProps) {
  const [activeModule, setActiveModule] = createSignal<SafetyModule>('dashboard');
  const [project, setProject] = createSignal<any>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [showMeetingForm, setShowMeetingForm] = createSignal(false);
  const [nextMeetingNumber, setNextMeetingNumber] = createSignal('SM-001');
  const [stats, setStats] = createSignal<any>({
    meetings: { total: 0, thisMonth: 0, nextDue: null },
    inspections: { total: 0, thisWeek: 0, violations: 0 },
    incidents: { total: 0, recordable: 0, daysSinceLastIncident: 0 },
    permits: { active: 0, pending: 0, total: 0 },
    training: { scheduled: 0, completed: 0, expiring: 0 },
    certifications: { active: 0, expiring: 0, expired: 0 },
  });

  onMount(async () => {
    await loadProjectData();
    await loadSafetyStats();
    await loadNextMeetingNumber();
  });

  const loadProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.project) {
          setProject(data.project);
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSafetyStats = async () => {
    try {
      const response = await fetch(`/api/safety/stats?projectId=${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load safety stats:', err);
    }
  };

  const loadNextMeetingNumber = async () => {
    try {
      const response = await fetch(`/api/safety/meetings?projectId=${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        const meetings = data.meetings || [];
        const nextNum = meetings.length + 1;
        setNextMeetingNumber(`SM-${String(nextNum).padStart(3, '0')}`);
      }
    } catch (err) {
      console.error('Failed to load next meeting number:', err);
    }
  };

  const handleCreateMeeting = () => {
    setShowMeetingForm(true);
  };

  const handleCancelMeeting = () => {
    setShowMeetingForm(false);
  };

  const handleMeetingSuccess = async () => {
    setShowMeetingForm(false);
    await loadSafetyStats();
    await loadNextMeetingNumber();
    // Reload the page to refresh the meeting list
    window.location.reload();
  };

  const modules = [
    {
      id: 'dashboard' as SafetyModule,
      name: 'Dashboard',
      icon: '📊',
      description: 'Safety overview and compliance status'
    },
    {
      id: 'timeline' as SafetyModule,
      name: 'Timeline',
      icon: '📅',
      description: 'Chronological activity log'
    },
    {
      id: 'action-plans' as SafetyModule,
      name: 'Safety Action Plans',
      icon: '📋',
      description: 'Site Safety Action Plans (Exhibit 4-1)'
    },
    {
      id: 'meetings' as SafetyModule,
      name: 'Safety Meetings',
      icon: '👥',
      description: 'Toolbox & Committee Meetings (Exhibit 7-1)'
    },
    {
      id: 'inspections' as SafetyModule,
      name: 'Inspections',
      icon: '🔍',
      description: 'Daily/Weekly Safety Inspections (Exhibit 5-2)'
    },
    {
      id: 'incidents' as SafetyModule,
      name: 'Incident Reports',
      icon: '⚠️',
      description: 'Accident/Incident Reporting (Exhibit 6-1)'
    },
    {
      id: 'jha' as SafetyModule,
      name: 'Job Hazard Analysis',
      icon: '🛡️',
      description: 'JHA Worksheets (Exhibit 5-6)'
    },
    {
      id: 'permits' as SafetyModule,
      name: 'Work Permits',
      icon: '📝',
      description: 'Hot Work & Other Permits (Exhibit 5-4)'
    },
    {
      id: 'crane-inspections' as SafetyModule,
      name: 'Crane Inspections',
      icon: '🏗️',
      description: 'Crane Inspection Records (Exhibit 5-3)'
    },
    {
      id: 'training' as SafetyModule,
      name: 'Training Records',
      icon: '📚',
      description: 'Safety training and certifications'
    },
    {
      id: 'certifications' as SafetyModule,
      name: 'Worker Certifications',
      icon: '🪪',
      description: 'DISD badges and worker certifications'
    },
  ];

  const renderDashboard = () => {
    const currentStats = stats();

    return (
      <div class="space-y-6">
        {/* DISD Emergency Contact Banner */}
        <div class="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-semibold text-red-900">DISD Safety Emergency Contact</h3>
              <div class="mt-2 text-sm text-red-800">
                <p><strong>Bond Safety Director:</strong> 214-435-2204</p>
                <p class="mt-1 text-xs">Contact immediately for all serious incidents, injuries, or safety emergencies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Status Overview */}
        <div>
          <h2 class="text-xl font-bold text-white mb-4">DISD Compliance Status</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Weekly Toolbox Meetings */}
            <div class="bg-gray-800 border-l-4 border-blue-500 rounded-lg shadow-sm p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">👥</span>
                  <h3 class="font-semibold text-white">Toolbox Meetings</h3>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Weekly Required
                </span>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">This Month:</span>
                  <span class="font-semibold text-white">{currentStats.meetings.thisMonth}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Next Due:</span>
                  <span class="font-semibold text-white">
                    {currentStats.meetings.nextDue || 'Schedule Meeting'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('meetings')}
                class="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                View Meetings
              </button>
            </div>

            {/* Safety Inspections */}
            <div class="bg-gray-800 border-l-4 border-green-500 rounded-lg shadow-sm p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">🔍</span>
                  <h3 class="font-semibold text-white">Inspections</h3>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Daily Required
                </span>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">This Week:</span>
                  <span class="font-semibold text-white">{currentStats.inspections.thisWeek}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Open Violations:</span>
                  <span class={`font-semibold ${currentStats.inspections.violations > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {currentStats.inspections.violations}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('inspections')}
                class="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                View Inspections
              </button>
            </div>

            {/* Incident Tracking */}
            <div class="bg-gray-800 border-l-4 border-orange-500 rounded-lg shadow-sm p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">⚠️</span>
                  <h3 class="font-semibold text-white">Incidents</h3>
                </div>
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentStats.incidents.total === 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {currentStats.incidents.total === 0 ? 'Zero Incidents' : `${currentStats.incidents.total} Total`}
                </span>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">OSHA Recordable:</span>
                  <span class="font-semibold text-white">{currentStats.incidents.recordable}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Days Since Last:</span>
                  <span class="font-semibold text-green-400">{currentStats.incidents.daysSinceLastIncident}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('incidents')}
                class="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
              >
                View Incidents
              </button>
            </div>
          </div>
        </div>

        {/* Additional Safety Modules */}
        <div>
          <h2 class="text-xl font-bold text-white mb-4">Safety Documentation</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Work Permits */}
            <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-5">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-3xl">📝</span>
                <div>
                  <h3 class="font-semibold text-white">Work Permits</h3>
                  <p class="text-xs text-gray-400">Hot Work, Confined Space, etc.</p>
                </div>
              </div>
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Active:</span>
                  <span class="font-semibold text-green-400">{currentStats.permits.active}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Pending Approval:</span>
                  <span class="font-semibold text-orange-400">{currentStats.permits.pending}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('permits')}
                class="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                Manage Permits
              </button>
            </div>

            {/* JHA */}
            <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-5">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-3xl">🛡️</span>
                <div>
                  <h3 class="font-semibold text-white">Job Hazard Analysis</h3>
                  <p class="text-xs text-gray-400">Exhibit 5-6</p>
                </div>
              </div>
              <div class="mb-4">
                <p class="text-sm text-gray-400">Identify and control workplace hazards before work begins</p>
              </div>
              <button
                onClick={() => setActiveModule('jha')}
                class="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                View JHAs
              </button>
            </div>

            {/* Crane Inspections */}
            <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-5">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-3xl">🏗️</span>
                <div>
                  <h3 class="font-semibold text-white">Crane Inspections</h3>
                  <p class="text-xs text-gray-400">Exhibit 5-3</p>
                </div>
              </div>
              <div class="mb-4">
                <p class="text-sm text-gray-400">Daily crane inspection records and certifications</p>
              </div>
              <button
                onClick={() => setActiveModule('crane-inspections')}
                class="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                View Inspections
              </button>
            </div>

            {/* Training */}
            <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-5">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-3xl">📚</span>
                <div>
                  <h3 class="font-semibold text-white">Safety Training</h3>
                  <p class="text-xs text-gray-400">OSHA 10/30, CPR, etc.</p>
                </div>
              </div>
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Scheduled:</span>
                  <span class="font-semibold text-blue-400">{currentStats.training.scheduled}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Expiring Soon:</span>
                  <span class="font-semibold text-orange-400">{currentStats.training.expiring}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('training')}
                class="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                Manage Training
              </button>
            </div>

            {/* Worker Certifications */}
            <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-5">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-3xl">🪪</span>
                <div>
                  <h3 class="font-semibold text-white">Worker Certifications</h3>
                  <p class="text-xs text-gray-400">DISD Badges & Certs</p>
                </div>
              </div>
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Active Workers:</span>
                  <span class="font-semibold text-green-400">{currentStats.certifications.active}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Expiring:</span>
                  <span class="font-semibold text-orange-400">{currentStats.certifications.expiring}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('certifications')}
                class="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                Manage Badges
              </button>
            </div>

            {/* Safety Action Plan */}
            <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-5">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-3xl">📋</span>
                <div>
                  <h3 class="font-semibold text-white">Safety Action Plan</h3>
                  <p class="text-xs text-gray-400">Exhibit 4-1</p>
                </div>
              </div>
              <div class="mb-4">
                <p class="text-sm text-gray-400">Site-specific safety action plan and procedures</p>
              </div>
              <button
                onClick={() => setActiveModule('action-plans')}
                class="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                View Plan
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700">
          <h2 class="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveModule('meetings')}
              class="px-4 py-3 bg-gray-800 text-blue-300 rounded-lg hover:bg-gray-700 transition shadow-sm font-medium text-sm"
            >
              + Schedule Toolbox Meeting
            </button>
            <button
              onClick={() => setActiveModule('inspections')}
              class="px-4 py-3 bg-gray-800 text-green-300 rounded-lg hover:bg-gray-700 transition shadow-sm font-medium text-sm"
            >
              + Daily Inspection
            </button>
            <button
              onClick={() => setActiveModule('incidents')}
              class="px-4 py-3 bg-gray-800 text-orange-300 rounded-lg hover:bg-gray-700 transition shadow-sm font-medium text-sm"
            >
              + Report Incident
            </button>
            <button
              onClick={() => setActiveModule('permits')}
              class="px-4 py-3 bg-gray-800 text-purple-300 rounded-lg hover:bg-gray-700 transition shadow-sm font-medium text-sm"
            >
              + Request Work Permit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderModulePlaceholder = (moduleName: string) => {
    return (
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-12 text-center">
        <div class="max-w-md mx-auto">
          <div class="text-6xl mb-4">🚧</div>
          <h3 class="text-xl font-bold text-white mb-2">{moduleName}</h3>
          <p class="text-gray-400 mb-6">
            This module is under construction. The interface will allow you to manage {moduleName.toLowerCase()}.
          </p>
          <button
            onClick={() => setActiveModule('dashboard')}
            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Show when={isLoading()}>
        <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p class="text-gray-400 mt-2">Loading safety dashboard...</p>
        </div>
      </Show>

      <Show when={!isLoading()}>
        {/* Module Navigation Tabs */}
        <div class="bg-gray-800 rounded-t-lg shadow-sm border border-gray-700 border-b-0 overflow-x-auto">
          <div class="flex gap-1 p-2 min-w-max">
            <For each={modules}>
              {(module) => (
                <button
                  onClick={() => setActiveModule(module.id)}
                  class={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm whitespace-nowrap ${
                    activeModule() === module.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-700'
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
        <div class="bg-gray-800 rounded-b-lg shadow-sm border border-gray-700 p-6">
          <Show when={activeModule() === 'dashboard'}>
            {renderDashboard()}
          </Show>

          <Show when={activeModule() === 'timeline'}>
            <SafetyTimeline projectId={props.projectId} />
          </Show>

          <Show when={activeModule() === 'action-plans'}>
            {renderModulePlaceholder('Safety Action Plans')}
          </Show>

          <Show when={activeModule() === 'meetings'}>
            <Show when={!showMeetingForm()}>
              <SafetyMeetingLog
                projectId={props.projectId}
                onCreateNew={handleCreateMeeting}
              />
            </Show>
            <Show when={showMeetingForm()}>
              <div>
                <button
                  onClick={handleCancelMeeting}
                  class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Meetings Log
                </button>
                <SafetyMeetingForm
                  projectId={props.projectId}
                  projectInfo={project()}
                  meetingNumber={nextMeetingNumber()}
                  onSuccess={handleMeetingSuccess}
                  onCancel={handleCancelMeeting}
                />
              </div>
            </Show>
          </Show>

          <Show when={activeModule() === 'inspections'}>
            {renderModulePlaceholder('Safety Inspections')}
          </Show>

          <Show when={activeModule() === 'incidents'}>
            {renderModulePlaceholder('Incident Reports')}
          </Show>

          <Show when={activeModule() === 'jha'}>
            {renderModulePlaceholder('Job Hazard Analysis')}
          </Show>

          <Show when={activeModule() === 'permits'}>
            {renderModulePlaceholder('Work Permits')}
          </Show>

          <Show when={activeModule() === 'crane-inspections'}>
            {renderModulePlaceholder('Crane Inspections')}
          </Show>

          <Show when={activeModule() === 'training'}>
            {renderModulePlaceholder('Safety Training')}
          </Show>

          <Show when={activeModule() === 'certifications'}>
            {renderModulePlaceholder('Worker Certifications')}
          </Show>
        </div>
      </Show>
    </div>
  );
}
