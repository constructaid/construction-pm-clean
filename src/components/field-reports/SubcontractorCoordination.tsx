/**
 * Subcontractor Coordination Component
 * Comprehensive subcontractor management for field superintendents
 * Tracks schedules, manpower, prerequisites, compliance, and coordination
 */
import { createSignal, onMount, Show, For } from 'solid-js';

interface SubcontractorCoordinationProps {
  projectId: number;
}

interface Subcontractor {
  id: number;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  trade: string;
  status: 'scheduled' | 'on-site' | 'completed' | 'delayed';
  scheduledDate: string;
  crewSize: number;
  insuranceExpiry: string;
  certificationsValid: boolean;
}

interface DailyManpower {
  id: number;
  date: string;
  subcontractorId: number;
  subcontractorName: string;
  trade: string;
  crewCount: number;
  supervisorName: string;
  workArea: string;
  startTime: string;
  endTime: string;
  notes: string;
}

interface Prerequisite {
  id: number;
  subcontractorId: number;
  subcontractorName: string;
  type: 'utilities' | 'access' | 'materials' | 'inspection' | 'other';
  description: string;
  requiredDate: string;
  status: 'pending' | 'ready' | 'delayed';
  notes: string;
}

interface CommunicationLog {
  id: number;
  date: string;
  subcontractorId: number;
  subcontractorName: string;
  type: 'call' | 'meeting' | 'email' | 'text' | 'site-visit';
  subject: string;
  notes: string;
  actionItems: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

interface EquipmentRequest {
  id: number;
  subcontractorId: number;
  subcontractorName: string;
  equipmentType: 'crane' | 'lift' | 'scaffold' | 'staging' | 'other';
  description: string;
  requestedDate: string;
  duration: string;
  location: string;
  status: 'requested' | 'approved' | 'scheduled' | 'completed';
  notes: string;
}

interface QualityIssue {
  id: number;
  subcontractorId: number;
  subcontractorName: string;
  trade: string;
  issueType: 'defect' | 'non-compliance' | 'rework' | 'incomplete';
  description: string;
  location: string;
  dateIdentified: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'resolved' | 'verified';
  priority: 'low' | 'medium' | 'high' | 'critical';
  photos: string[];
  notes: string;
}

type ViewMode = 'overview' | 'schedule' | 'manpower' | 'prerequisites' | 'compliance' | 'rfis' | 'submittals' | 'change-orders' | 'communications' | 'equipment' | 'quality';

export default function SubcontractorCoordination(props: SubcontractorCoordinationProps) {
  const [viewMode, setViewMode] = createSignal<ViewMode>('overview');
  const [subcontractors, setSubcontractors] = createSignal<Subcontractor[]>([]);
  const [dailyManpower, setDailyManpower] = createSignal<DailyManpower[]>([]);
  const [prerequisites, setPrerequisites] = createSignal<Prerequisite[]>([]);
  const [communications, setCommunications] = createSignal<CommunicationLog[]>([]);
  const [equipmentRequests, setEquipmentRequests] = createSignal<EquipmentRequest[]>([]);
  const [qualityIssues, setQualityIssues] = createSignal<QualityIssue[]>([]);
  const [rfis, setRfis] = createSignal<any[]>([]);
  const [submittals, setSubmittals] = createSignal<any[]>([]);
  const [changeOrders, setChangeOrders] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showAddForm, setShowAddForm] = createSignal(false);
  const [selectedDate, setSelectedDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [selectedSubcontractor, setSelectedSubcontractor] = createSignal<number | null>(null);

  // Form states
  const [newManpower, setNewManpower] = createSignal<Partial<DailyManpower>>({
    date: new Date().toISOString().split('T')[0],
    crewCount: 0,
  });

  const [newPrerequisite, setNewPrerequisite] = createSignal<Partial<Prerequisite>>({
    status: 'pending',
    type: 'materials',
  });

  const [newCommunication, setNewCommunication] = createSignal<Partial<CommunicationLog>>({
    date: new Date().toISOString().split('T')[0],
    type: 'call',
    followUpRequired: false,
  });

  const [newEquipmentRequest, setNewEquipmentRequest] = createSignal<Partial<EquipmentRequest>>({
    equipmentType: 'crane',
    status: 'requested',
  });

  const [newQualityIssue, setNewQualityIssue] = createSignal<Partial<QualityIssue>>({
    issueType: 'defect',
    status: 'open',
    priority: 'medium',
    photos: [],
  });

  onMount(async () => {
    await loadData();
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load subcontractors from contacts API
      const subResponse = await fetch(`/api/contacts?projectId=${props.projectId}&type=subcontractor`);
      if (subResponse.ok) {
        const subData = await subResponse.json();
        if (subData.success && subData.data?.contacts) {
          // Map contacts to subcontractor format
          const subs = subData.data.contacts.map((contact: any) => ({
            id: contact.id,
            companyName: contact.company || contact.name,
            contactName: contact.name,
            phone: contact.phone || 'N/A',
            email: contact.email || 'N/A',
            trade: contact.title || 'General',
            status: 'scheduled',
            scheduledDate: new Date().toISOString().split('T')[0],
            crewSize: 0,
            insuranceExpiry: '',
            certificationsValid: true,
          }));
          setSubcontractors(subs);
        }
      }

      // Load RFIs for the project
      const rfiResponse = await fetch(`/api/rfis?projectId=${props.projectId}`);
      if (rfiResponse.ok) {
        const rfiData = await rfiResponse.json();
        if (rfiData.success && rfiData.data?.rfis) {
          setRfis(rfiData.data.rfis);
        }
      }

      // Load Submittals for the project
      const submittalResponse = await fetch(`/api/submittals?projectId=${props.projectId}`);
      if (submittalResponse.ok) {
        const submittalData = await submittalResponse.json();
        if (submittalData.success && submittalData.data?.submittals) {
          setSubmittals(submittalData.data.submittals);
        }
      }

      // Load Change Orders for the project
      const coResponse = await fetch(`/api/change-orders?projectId=${props.projectId}`);
      if (coResponse.ok) {
        const coData = await coResponse.json();
        if (coData.success && coData.data?.changeOrders) {
          setChangeOrders(coData.data.changeOrders);
        }
      }

      // Initialize local-only data (will be persisted to API later)
      setDailyManpower([]);
      setPrerequisites([]);
      setCommunications([]);
      setEquipmentRequests([]);
      setQualityIssues([]);
    } catch (error) {
      console.error('Error loading subcontractor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addManpowerEntry = () => {
    const entry: DailyManpower = {
      id: Date.now(),
      date: newManpower().date || new Date().toISOString().split('T')[0],
      subcontractorId: newManpower().subcontractorId || 0,
      subcontractorName: newManpower().subcontractorName || '',
      trade: newManpower().trade || '',
      crewCount: newManpower().crewCount || 0,
      supervisorName: newManpower().supervisorName || '',
      workArea: newManpower().workArea || '',
      startTime: newManpower().startTime || '07:00',
      endTime: newManpower().endTime || '16:00',
      notes: newManpower().notes || '',
    };

    setDailyManpower([...dailyManpower(), entry]);
    setNewManpower({ date: new Date().toISOString().split('T')[0], crewCount: 0 });
    setShowAddForm(false);
  };

  const addPrerequisite = () => {
    const prereq: Prerequisite = {
      id: Date.now(),
      subcontractorId: newPrerequisite().subcontractorId || 0,
      subcontractorName: newPrerequisite().subcontractorName || '',
      type: newPrerequisite().type || 'materials',
      description: newPrerequisite().description || '',
      requiredDate: newPrerequisite().requiredDate || new Date().toISOString().split('T')[0],
      status: newPrerequisite().status || 'pending',
      notes: newPrerequisite().notes || '',
    };

    setPrerequisites([...prerequisites(), prereq]);
    setNewPrerequisite({ status: 'pending', type: 'materials' });
  };

  const updatePrerequisiteStatus = (id: number, status: 'pending' | 'ready' | 'delayed') => {
    setPrerequisites(
      prerequisites().map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-site':
      case 'ready':
        return 'bg-green-500';
      case 'scheduled':
      case 'pending':
        return 'bg-yellow-500';
      case 'delayed':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderOverview = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysManpower = dailyManpower().filter((m) => m.date === today);
    const totalCrewToday = todaysManpower.reduce((sum, m) => sum + m.crewCount, 0);
    const activeSubs = subcontractors().filter((s) => s.status === 'on-site');
    const pendingPrereqs = prerequisites().filter((p) => p.status === 'pending');

    return (
      <div class="space-y-6">
        {/* Quick Stats */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-400">Active Subs Today</h3>
              <span class="text-2xl">👷</span>
            </div>
            <p class="text-3xl font-bold text-white">{activeSubs.length}</p>
          </div>

          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-400">Total Crew Today</h3>
              <span class="text-2xl">👥</span>
            </div>
            <p class="text-3xl font-bold text-white">{totalCrewToday}</p>
          </div>

          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-400">Pending Prerequisites</h3>
              <span class="text-2xl">⏳</span>
            </div>
            <p class="text-3xl font-bold text-white">{pendingPrereqs.length}</p>
          </div>

          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-400">Total Subcontractors</h3>
              <span class="text-2xl">🏗️</span>
            </div>
            <p class="text-3xl font-bold text-white">{subcontractors().length}</p>
          </div>
        </div>

        {/* Pending Prerequisites Alert */}
        <Show when={pendingPrereqs.length > 0}>
          <div class="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg">
            <div class="flex items-start">
              <svg class="h-6 w-6 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="ml-3">
                <h3 class="text-sm font-semibold text-yellow-300">Prerequisites Need Attention</h3>
                <p class="text-sm text-yellow-200 mt-1">{pendingPrereqs.length} prerequisite(s) pending completion</p>
                <button
                  onClick={() => setViewMode('prerequisites')}
                  class="mt-2 text-sm text-yellow-300 hover:text-yellow-100 underline"
                >
                  View Prerequisites →
                </button>
              </div>
            </div>
          </div>
        </Show>

        {/* Today's Active Subcontractors */}
        <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white">Today's Manpower Log</h3>
            <button
              onClick={() => setViewMode('manpower')}
              class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:bg-ca-teal/80 transition text-sm"
            >
              Log Manpower
            </button>
          </div>

          <Show when={todaysManpower.length === 0}>
            <p class="text-gray-400 text-center py-8">No manpower logged for today yet</p>
          </Show>

          <Show when={todaysManpower.length > 0}>
            <div class="space-y-3">
              <For each={todaysManpower}>
                {(entry) => (
                  <div class="bg-gray-700/50 rounded-lg p-4">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h4 class="font-semibold text-white">{entry.subcontractorName}</h4>
                          <span class="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">{entry.trade}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <p class="text-gray-400">Crew: <span class="text-white font-medium">{entry.crewCount} workers</span></p>
                          <p class="text-gray-400">Supervisor: <span class="text-white">{entry.supervisorName}</span></p>
                          <p class="text-gray-400">Work Area: <span class="text-white">{entry.workArea}</span></p>
                          <p class="text-gray-400">Hours: <span class="text-white">{entry.startTime} - {entry.endTime}</span></p>
                        </div>
                        <Show when={entry.notes}>
                          <p class="text-sm text-gray-300 mt-2 italic">{entry.notes}</p>
                        </Show>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Quick Actions */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setViewMode('schedule')}
            class="bg-gray-800 border border-gray-700 hover:border-ca-teal rounded-lg p-6 text-left transition"
          >
            <div class="text-3xl mb-3">📅</div>
            <h3 class="font-semibold text-white mb-1">View Schedule</h3>
            <p class="text-sm text-gray-400">See subcontractor schedule and upcoming work</p>
          </button>

          <button
            onClick={() => setViewMode('prerequisites')}
            class="bg-gray-800 border border-gray-700 hover:border-ca-orange rounded-lg p-6 text-left transition"
          >
            <div class="text-3xl mb-3">✅</div>
            <h3 class="font-semibold text-white mb-1">Prerequisites</h3>
            <p class="text-sm text-gray-400">Track utilities, access, and material readiness</p>
          </button>

          <button
            onClick={() => setViewMode('compliance')}
            class="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-lg p-6 text-left transition"
          >
            <div class="text-3xl mb-3">📋</div>
            <h3 class="font-semibold text-white mb-1">Compliance</h3>
            <p class="text-sm text-gray-400">Insurance, certifications, and safety docs</p>
          </button>
        </div>
      </div>
    );
  };

  const renderSchedule = () => {
    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Subcontractor Schedule</h3>
          <input
            type="date"
            value={selectedDate()}
            onInput={(e) => setSelectedDate(e.currentTarget.value)}
            class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
        </div>

        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trade</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Scheduled Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Crew Size</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <For each={subcontractors()}>
                {(sub) => (
                  <tr class="hover:bg-gray-700/50 transition">
                    <td class="px-6 py-4 text-white font-medium">{sub.companyName}</td>
                    <td class="px-6 py-4 text-gray-300">{sub.trade}</td>
                    <td class="px-6 py-4">
                      <div class="text-sm">
                        <div class="text-white">{sub.contactName}</div>
                        <div class="text-gray-400">{sub.phone}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-gray-300">{new Date(sub.scheduledDate).toLocaleDateString()}</td>
                    <td class="px-6 py-4 text-gray-300">{sub.crewSize || 'TBD'}</td>
                    <td class="px-6 py-4">
                      <span class={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(sub.status)}`}>
                        {sub.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>

          <Show when={subcontractors().length === 0}>
            <div class="text-center py-12 text-gray-400">
              <p class="mb-2">No subcontractors found</p>
              <p class="text-sm">Add subcontractors in the Contacts module</p>
            </div>
          </Show>
        </div>
      </div>
    );
  };

  const renderManpower = () => {
    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Daily Manpower Tracking</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm())}
            class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:bg-ca-teal/80 transition"
          >
            {showAddForm() ? 'Cancel' : '+ Log Manpower'}
          </button>
        </div>

        <Show when={showAddForm()}>
          <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h4 class="text-lg font-semibold text-white mb-4">Log Daily Manpower</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={newManpower().date}
                  onInput={(e) => setNewManpower({ ...newManpower(), date: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Subcontractor</label>
                <select
                  onInput={(e) => {
                    const subId = parseInt(e.currentTarget.value);
                    const sub = subcontractors().find((s) => s.id === subId);
                    setNewManpower({
                      ...newManpower(),
                      subcontractorId: subId,
                      subcontractorName: sub?.companyName || '',
                      trade: sub?.trade || '',
                    });
                  }}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select subcontractor...</option>
                  <For each={subcontractors()}>
                    {(sub) => <option value={sub.id}>{sub.companyName} - {sub.trade}</option>}
                  </For>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Crew Count</label>
                <input
                  type="number"
                  min="0"
                  value={newManpower().crewCount}
                  onInput={(e) => setNewManpower({ ...newManpower(), crewCount: parseInt(e.currentTarget.value) || 0 })}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Supervisor Name</label>
                <input
                  type="text"
                  value={newManpower().supervisorName}
                  onInput={(e) => setNewManpower({ ...newManpower(), supervisorName: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Work Area</label>
                <input
                  type="text"
                  value={newManpower().workArea}
                  onInput={(e) => setNewManpower({ ...newManpower(), workArea: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="e.g., Building A - 2nd Floor"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newManpower().startTime}
                    onInput={(e) => setNewManpower({ ...newManpower(), startTime: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={newManpower().endTime}
                    onInput={(e) => setNewManpower({ ...newManpower(), endTime: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={newManpower().notes}
                  onInput={(e) => setNewManpower({ ...newManpower(), notes: e.currentTarget.value })}
                  rows="3"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Work performed, issues, equipment used, etc."
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={addManpowerEntry}
                class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:bg-ca-teal/80 transition"
              >
                Save Entry
              </button>
            </div>
          </div>
        </Show>

        {/* Manpower History */}
        <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h4 class="text-lg font-semibold text-white mb-4">Manpower Log History</h4>

          <Show when={dailyManpower().length === 0}>
            <p class="text-gray-400 text-center py-8">No manpower entries logged yet</p>
          </Show>

          <Show when={dailyManpower().length > 0}>
            <div class="space-y-3">
              <For each={dailyManpower().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}>
                {(entry) => (
                  <div class="bg-gray-700/50 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <h5 class="font-semibold text-white">{entry.subcontractorName}</h5>
                        <p class="text-sm text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                      <span class="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">{entry.trade}</span>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p class="text-gray-400">Crew Count</p>
                        <p class="text-white font-medium">{entry.crewCount}</p>
                      </div>
                      <div>
                        <p class="text-gray-400">Supervisor</p>
                        <p class="text-white">{entry.supervisorName}</p>
                      </div>
                      <div>
                        <p class="text-gray-400">Work Area</p>
                        <p class="text-white">{entry.workArea}</p>
                      </div>
                      <div>
                        <p class="text-gray-400">Hours</p>
                        <p class="text-white">{entry.startTime} - {entry.endTime}</p>
                      </div>
                    </div>
                    <Show when={entry.notes}>
                      <p class="text-sm text-gray-300 mt-3 p-3 bg-gray-800/50 rounded italic">{entry.notes}</p>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    );
  };

  const renderPrerequisites = () => {
    const grouped = {
      pending: prerequisites().filter((p) => p.status === 'pending'),
      ready: prerequisites().filter((p) => p.status === 'ready'),
      delayed: prerequisites().filter((p) => p.status === 'delayed'),
    };

    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Prerequisite Tracking</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm())}
            class="px-4 py-2 bg-ca-orange text-white rounded-lg hover:bg-ca-orange-dark transition"
          >
            {showAddForm() ? 'Cancel' : '+ Add Prerequisite'}
          </button>
        </div>

        <Show when={showAddForm()}>
          <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h4 class="text-lg font-semibold text-white mb-4">Add Prerequisite</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Subcontractor</label>
                <select
                  onInput={(e) => {
                    const subId = parseInt(e.currentTarget.value);
                    const sub = subcontractors().find((s) => s.id === subId);
                    setNewPrerequisite({
                      ...newPrerequisite(),
                      subcontractorId: subId,
                      subcontractorName: sub?.companyName || '',
                    });
                  }}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select subcontractor...</option>
                  <For each={subcontractors()}>
                    {(sub) => <option value={sub.id}>{sub.companyName}</option>}
                  </For>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={newPrerequisite().type}
                  onInput={(e) => setNewPrerequisite({ ...newPrerequisite(), type: e.currentTarget.value as any })}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="utilities">Utilities (Power, Water, etc.)</option>
                  <option value="access">Site Access / Clearance</option>
                  <option value="materials">Materials / Equipment</option>
                  <option value="inspection">Prior Inspection Required</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Required Date</label>
                <input
                  type="date"
                  value={newPrerequisite().requiredDate}
                  onInput={(e) => setNewPrerequisite({ ...newPrerequisite(), requiredDate: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={newPrerequisite().status}
                  onInput={(e) => setNewPrerequisite({ ...newPrerequisite(), status: e.currentTarget.value as any })}
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="ready">Ready</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newPrerequisite().description}
                  onInput={(e) => setNewPrerequisite({ ...newPrerequisite(), description: e.currentTarget.value })}
                  rows="2"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="What is needed?"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={newPrerequisite().notes}
                  onInput={(e) => setNewPrerequisite({ ...newPrerequisite(), notes: e.currentTarget.value })}
                  rows="2"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Additional details, coordination notes, etc."
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={addPrerequisite}
                class="px-4 py-2 bg-ca-orange text-white rounded-lg hover:bg-ca-orange-dark transition"
              >
                Add Prerequisite
              </button>
            </div>
          </div>
        </Show>

        {/* Prerequisites by Status */}
        <div class="space-y-6">
          {/* Pending */}
          <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
              Pending Prerequisites ({grouped.pending.length})
            </h4>

            <Show when={grouped.pending.length === 0}>
              <p class="text-gray-400 text-center py-4">No pending prerequisites</p>
            </Show>

            <div class="space-y-3">
              <For each={grouped.pending}>
                {(prereq) => (
                  <div class="bg-gray-700/50 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <h5 class="font-semibold text-white">{prereq.subcontractorName}</h5>
                        <p class="text-sm text-gray-400 mt-1">{prereq.description}</p>
                      </div>
                      <span class="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded font-medium ml-4">
                        {prereq.type.toUpperCase()}
                      </span>
                    </div>
                    <div class="flex items-center justify-between mt-3">
                      <p class="text-sm text-gray-400">Required: {new Date(prereq.requiredDate).toLocaleDateString()}</p>
                      <div class="flex gap-2">
                        <button
                          onClick={() => updatePrerequisiteStatus(prereq.id, 'ready')}
                          class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500 transition"
                        >
                          Mark Ready
                        </button>
                        <button
                          onClick={() => updatePrerequisiteStatus(prereq.id, 'delayed')}
                          class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition"
                        >
                          Mark Delayed
                        </button>
                      </div>
                    </div>
                    <Show when={prereq.notes}>
                      <p class="text-sm text-gray-300 mt-2 p-2 bg-gray-800/50 rounded italic">{prereq.notes}</p>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Ready */}
          <Show when={grouped.ready.length > 0}>
            <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-green-500"></span>
                Ready ({grouped.ready.length})
              </h4>
              <div class="space-y-3">
                <For each={grouped.ready}>
                  {(prereq) => (
                    <div class="bg-gray-700/50 rounded-lg p-4">
                      <div class="flex items-start justify-between">
                        <div>
                          <h5 class="font-semibold text-white">{prereq.subcontractorName}</h5>
                          <p class="text-sm text-gray-400 mt-1">{prereq.description}</p>
                        </div>
                        <span class="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded font-medium">READY</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Delayed */}
          <Show when={grouped.delayed.length > 0}>
            <div class="bg-gray-800 rounded-lg border border-red-500/50 p-6">
              <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-red-500"></span>
                Delayed ({grouped.delayed.length})
              </h4>
              <div class="space-y-3">
                <For each={grouped.delayed}>
                  {(prereq) => (
                    <div class="bg-red-900/20 rounded-lg p-4">
                      <div class="flex items-start justify-between mb-2">
                        <div>
                          <h5 class="font-semibold text-white">{prereq.subcontractorName}</h5>
                          <p class="text-sm text-gray-400 mt-1">{prereq.description}</p>
                          <p class="text-sm text-red-300 mt-2">⚠️ Required: {new Date(prereq.requiredDate).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => updatePrerequisiteStatus(prereq.id, 'ready')}
                          class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500 transition"
                        >
                          Mark Ready
                        </button>
                      </div>
                      <Show when={prereq.notes}>
                        <p class="text-sm text-gray-300 mt-2 p-2 bg-gray-800/50 rounded italic">{prereq.notes}</p>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    );
  };

  const renderCompliance = () => {
    return (
      <div class="space-y-6">
        <h3 class="text-xl font-bold text-white">Subcontractor Compliance</h3>

        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trade</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Insurance Expiry</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Certifications</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <For each={subcontractors()}>
                {(sub) => {
                  const insuranceValid = sub.insuranceExpiry && new Date(sub.insuranceExpiry) > new Date();
                  return (
                    <tr class="hover:bg-gray-700/50 transition">
                      <td class="px-6 py-4 text-white font-medium">{sub.companyName}</td>
                      <td class="px-6 py-4 text-gray-300">{sub.trade}</td>
                      <td class="px-6 py-4">
                        <Show when={sub.insuranceExpiry} fallback={<span class="text-yellow-400">Not on file</span>}>
                          <span class={insuranceValid ? 'text-green-400' : 'text-red-400'}>
                            {new Date(sub.insuranceExpiry).toLocaleDateString()}
                          </span>
                        </Show>
                      </td>
                      <td class="px-6 py-4">
                        <span class={sub.certificationsValid ? 'text-green-400' : 'text-red-400'}>
                          {sub.certificationsValid ? '✓ Valid' : '✗ Expired'}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class={`px-3 py-1 rounded-full text-xs font-medium ${
                          insuranceValid && sub.certificationsValid ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {insuranceValid && sub.certificationsValid ? 'Compliant' : 'Action Required'}
                        </span>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>

          <Show when={subcontractors().length === 0}>
            <div class="text-center py-12 text-gray-400">
              <p>No subcontractors to track compliance for</p>
            </div>
          </Show>
        </div>

        <div class="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
          <div class="flex items-start">
            <svg class="h-6 w-6 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="ml-3">
              <h4 class="text-sm font-semibold text-blue-300">Compliance Tracking</h4>
              <p class="text-sm text-blue-200 mt-1">
                Insurance and certification documents should be collected and verified before allowing subcontractors on site.
                Contact the project manager or safety coordinator for document uploads and verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRFIs = () => {
    const filteredRFIs = selectedSubcontractor()
      ? rfis().filter((rfi: any) => rfi.assignedTo === selectedSubcontractor() || rfi.requestedBy === selectedSubcontractor())
      : rfis();

    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">RFI Logs</h3>
          <select
            value={selectedSubcontractor() || ''}
            onInput={(e) => setSelectedSubcontractor(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
            class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">All Subcontractors</option>
            <For each={subcontractors()}>
              {(sub) => <option value={sub.id}>{sub.companyName}</option>}
            </For>
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p class="text-sm text-gray-400 mb-1">Total RFIs</p>
            <p class="text-3xl font-bold text-white">{filteredRFIs.length}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 border border-yellow-500/50">
            <p class="text-sm text-gray-400 mb-1">Open RFIs</p>
            <p class="text-3xl font-bold text-yellow-400">{filteredRFIs.filter((r: any) => r.status === 'open').length}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 border border-red-500/50">
            <p class="text-sm text-gray-400 mb-1">Overdue</p>
            <p class="text-3xl font-bold text-red-400">
              {filteredRFIs.filter((r: any) => r.status === 'open' && new Date(r.dueDate) < new Date()).length}
            </p>
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg border border-gray-700">
          <Show when={filteredRFIs.length === 0}>
            <div class="text-center py-12 text-gray-400">
              <p>No RFIs found{selectedSubcontractor() ? ' for this subcontractor' : ''}</p>
            </div>
          </Show>

          <Show when={filteredRFIs.length > 0}>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">RFI #</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Subject</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Priority</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Due Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                  <For each={filteredRFIs}>
                    {(rfi: any) => {
                      const isOverdue = rfi.status === 'open' && new Date(rfi.dueDate) < new Date();
                      return (
                        <tr class="hover:bg-gray-700/50 transition">
                          <td class="px-6 py-4 text-white font-medium">{rfi.rfiNumber}</td>
                          <td class="px-6 py-4">
                            <div class="text-white font-medium">{rfi.subject}</div>
                            <div class="text-sm text-gray-400 mt-1">{rfi.description?.substring(0, 60)}...</div>
                          </td>
                          <td class="px-6 py-4">
                            <span class={`px-2 py-1 rounded text-xs font-medium ${
                              rfi.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                              rfi.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {rfi.priority?.toUpperCase()}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <span class={`px-2 py-1 rounded text-xs font-medium ${
                              rfi.status === 'closed' ? 'bg-green-500/20 text-green-300' :
                              rfi.status === 'in_review' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {rfi.status?.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <span class={isOverdue ? 'text-red-400 font-semibold' : 'text-gray-300'}>
                              {new Date(rfi.dueDate).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      );
                    }}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </div>
    );
  };

  const renderSubmittals = () => {
    const filteredSubmittals = selectedSubcontractor()
      ? submittals().filter((s: any) => s.assignedTo === selectedSubcontractor() || s.submittedBy === selectedSubcontractor())
      : submittals();

    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Submittal Logs</h3>
          <select
            value={selectedSubcontractor() || ''}
            onInput={(e) => setSelectedSubcontractor(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
            class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">All Subcontractors</option>
            <For each={subcontractors()}>
              {(sub) => <option value={sub.id}>{sub.companyName}</option>}
            </For>
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p class="text-sm text-gray-400 mb-1">Total</p>
            <p class="text-3xl font-bold text-white">{filteredSubmittals.length}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 border border-yellow-500/50">
            <p class="text-sm text-gray-400 mb-1">Pending</p>
            <p class="text-3xl font-bold text-yellow-400">{filteredSubmittals.filter((s: any) => s.status === 'pending').length}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 border border-blue-500/50">
            <p class="text-sm text-gray-400 mb-1">In Review</p>
            <p class="text-3xl font-bold text-blue-400">{filteredSubmittals.filter((s: any) => s.status === 'in_review').length}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 border border-green-500/50">
            <p class="text-sm text-gray-400 mb-1">Approved</p>
            <p class="text-3xl font-bold text-green-400">{filteredSubmittals.filter((s: any) => s.status === 'approved').length}</p>
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
          <Show when={filteredSubmittals.length === 0}>
            <div class="text-center py-12 text-gray-400">
              <p>No submittals found{selectedSubcontractor() ? ' for this subcontractor' : ''}</p>
            </div>
          </Show>

          <Show when={filteredSubmittals.length > 0}>
            <table class="w-full">
              <thead class="bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Number</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Title</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Spec Section</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                <For each={filteredSubmittals}>
                  {(submittal: any) => (
                    <tr class="hover:bg-gray-700/50">
                      <td class="px-6 py-4 text-white font-medium">{submittal.submittalNumber}</td>
                      <td class="px-6 py-4 text-gray-300">{submittal.title}</td>
                      <td class="px-6 py-4 text-gray-400">{submittal.specSection}</td>
                      <td class="px-6 py-4">
                        <span class={`px-2 py-1 rounded text-xs font-medium ${
                          submittal.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                          submittal.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                          submittal.status === 'in_review' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {submittal.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-gray-300">{new Date(submittal.dueDate).toLocaleDateString()}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </div>
      </div>
    );
  };

  const renderChangeOrders = () => {
    const filteredCOs = selectedSubcontractor()
      ? changeOrders().filter((co: any) => co.affectedParties?.includes(selectedSubcontractor()))
      : changeOrders();

    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Change Orders</h3>
          <select
            value={selectedSubcontractor() || ''}
            onInput={(e) => setSelectedSubcontractor(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
            class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">All Subcontractors</option>
            <For each={subcontractors()}>
              {(sub) => <option value={sub.id}>{sub.companyName}</option>}
            </For>
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p class="text-sm text-gray-400 mb-1">Total COs</p>
            <p class="text-3xl font-bold text-white">{filteredCOs.length}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 border border-yellow-500/50">
            <p class="text-sm text-gray-400 mb-1">Pending</p>
            <p class="text-3xl font-bold text-yellow-400">{filteredCOs.filter((co: any) => co.status === 'pending').length}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 border border-green-500/50">
            <p class="text-sm text-gray-400 mb-1">Total Impact</p>
            <p class="text-3xl font-bold text-green-400">
              ${filteredCOs.reduce((sum: number, co: any) => sum + (co.amount || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
          <Show when={filteredCOs.length === 0}>
            <div class="text-center py-12 text-gray-400">
              <p>No change orders found{selectedSubcontractor() ? ' affecting this subcontractor' : ''}</p>
            </div>
          </Show>

          <Show when={filteredCOs.length > 0}>
            <table class="w-full">
              <thead class="bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">CO #</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                <For each={filteredCOs}>
                  {(co: any) => (
                    <tr class="hover:bg-gray-700/50">
                      <td class="px-6 py-4 text-white font-medium">{co.changeOrderNumber}</td>
                      <td class="px-6 py-4 text-gray-300">{co.description}</td>
                      <td class="px-6 py-4 text-white font-semibold">${co.amount?.toLocaleString()}</td>
                      <td class="px-6 py-4">
                        <span class={`px-2 py-1 rounded text-xs font-medium ${
                          co.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                          co.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {co.status?.toUpperCase()}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-gray-300">{new Date(co.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </div>
      </div>
    );
  };

  const renderCommunications = () => {
    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Communication Log</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm())}
            class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:bg-ca-teal/80 transition"
          >
            {showAddForm() ? 'Cancel' : '+ Log Communication'}
          </button>
        </div>

        <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
          <div class="text-6xl mb-4">📞</div>
          <h4 class="text-xl font-bold text-white mb-2">Daily Communication Log</h4>
          <p class="text-gray-400 mb-4">Track calls, meetings, emails, and site visits with subcontractors</p>
          <p class="text-sm text-gray-500">Feature coming soon - Log all coordination communications</p>
        </div>
      </div>
    );
  };

  const renderEquipment = () => {
    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Equipment Coordination</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm())}
            class="px-4 py-2 bg-ca-orange text-white rounded-lg hover:bg-ca-orange-dark transition"
          >
            {showAddForm() ? 'Cancel' : '+ Request Equipment'}
          </button>
        </div>

        <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
          <div class="text-6xl mb-4">🏗️</div>
          <h4 class="text-xl font-bold text-white mb-2">Equipment & Logistics</h4>
          <p class="text-gray-400 mb-4">Coordinate cranes, lifts, scaffolding, and staging areas</p>
          <p class="text-sm text-gray-500">Feature coming soon - Track equipment requests and scheduling</p>
        </div>
      </div>
    );
  };

  const renderQuality = () => {
    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Quality Issues & Punch List</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm())}
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"
          >
            {showAddForm() ? 'Cancel' : '+ Report Issue'}
          </button>
        </div>

        <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
          <div class="text-6xl mb-4">🔍</div>
          <h4 class="text-xl font-bold text-white mb-2">Quality Control</h4>
          <p class="text-gray-400 mb-4">Track defects, non-compliance, rework, and punch list items by subcontractor</p>
          <p class="text-sm text-gray-500">Feature coming soon - Full quality issue tracking and resolution</p>
        </div>
      </div>
    );
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Subcontractor Coordination</h2>
          <p class="text-gray-400 mt-1">Manage schedules, manpower, prerequisites, and compliance</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div class="border-b border-gray-700">
        <nav class="flex gap-4">
          <button
            onClick={() => setViewMode('overview')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'overview'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'schedule'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setViewMode('manpower')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'manpower'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Manpower
          </button>
          <button
            onClick={() => setViewMode('prerequisites')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'prerequisites'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Prerequisites
          </button>
          <button
            onClick={() => setViewMode('compliance')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'compliance'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Compliance
          </button>
          <button
            onClick={() => setViewMode('rfis')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'rfis'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            RFIs
          </button>
          <button
            onClick={() => setViewMode('submittals')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'submittals'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Submittals
          </button>
          <button
            onClick={() => setViewMode('change-orders')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'change-orders'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Change Orders
          </button>
          <button
            onClick={() => setViewMode('communications')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'communications'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Communications
          </button>
          <button
            onClick={() => setViewMode('equipment')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'equipment'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Equipment
          </button>
          <button
            onClick={() => setViewMode('quality')}
            class={`px-4 py-3 font-medium border-b-2 transition ${
              viewMode() === 'quality'
                ? 'border-ca-teal text-ca-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Quality
          </button>
        </nav>
      </div>

      {/* Loading State */}
      <Show when={loading()}>
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ca-teal mx-auto"></div>
          <p class="mt-4 text-gray-400">Loading subcontractor data...</p>
        </div>
      </Show>

      {/* Content */}
      <Show when={!loading()}>
        <Show when={viewMode() === 'overview'}>{renderOverview()}</Show>
        <Show when={viewMode() === 'schedule'}>{renderSchedule()}</Show>
        <Show when={viewMode() === 'manpower'}>{renderManpower()}</Show>
        <Show when={viewMode() === 'prerequisites'}>{renderPrerequisites()}</Show>
        <Show when={viewMode() === 'compliance'}>{renderCompliance()}</Show>
        <Show when={viewMode() === 'rfis'}>{renderRFIs()}</Show>
        <Show when={viewMode() === 'submittals'}>{renderSubmittals()}</Show>
        <Show when={viewMode() === 'change-orders'}>{renderChangeOrders()}</Show>
        <Show when={viewMode() === 'communications'}>{renderCommunications()}</Show>
        <Show when={viewMode() === 'equipment'}>{renderEquipment()}</Show>
        <Show when={viewMode() === 'quality'}>{renderQuality()}</Show>
      </Show>
    </div>
  );
}
