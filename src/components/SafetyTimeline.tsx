/**
 * Safety Timeline Component
 * Unified chronological view of all safety activities
 * Shows meetings, inspections, incidents, permits, training, etc.
 */
import { createSignal, onMount, For, Show } from 'solid-js';

interface SafetyTimelineProps {
  projectId: number;
}

interface TimelineEvent {
  id: number;
  type: 'meeting' | 'inspection' | 'incident' | 'permit' | 'training' | 'jha' | 'certification';
  date: string;
  title: string;
  description: string;
  status?: string;
  severity?: string;
  details: any;
}

export default function SafetyTimeline(props: SafetyTimelineProps) {
  const [events, setEvents] = createSignal<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [filterType, setFilterType] = createSignal<string>('all');
  const [selectedEvent, setSelectedEvent] = createSignal<TimelineEvent | null>(null);

  onMount(async () => {
    await loadAllEvents();
  });

  const loadAllEvents = async () => {
    setIsLoading(true);
    try {
      // Load all safety data in parallel
      const [meetings, inspections, incidents, permits] = await Promise.all([
        fetch(`/api/safety/meetings?projectId=${props.projectId}`).then(r => r.json()),
        fetch(`/api/safety/inspections?projectId=${props.projectId}`).then(r => r.json()),
        fetch(`/api/safety/incidents?projectId=${props.projectId}`).then(r => r.json()).catch(() => ({ success: true, incidents: [] })),
        fetch(`/api/safety/permits?projectId=${props.projectId}`).then(r => r.json()).catch(() => ({ success: true, permits: [] })),
      ]);

      const allEvents: TimelineEvent[] = [];

      // Add meetings
      if (meetings.success && meetings.meetings) {
        meetings.meetings.forEach((m: any) => {
          allEvents.push({
            id: m.id,
            type: 'meeting',
            date: m.meetingDate,
            title: m.topic,
            description: `${getMeetingTypeLabel(m.meetingType)} - ${m.attendanceCount} attendees`,
            status: m.meetingType,
            details: m
          });
        });
      }

      // Add inspections
      if (inspections.success && inspections.inspections) {
        inspections.inspections.forEach((i: any) => {
          allEvents.push({
            id: i.id,
            type: 'inspection',
            date: i.inspectionDate,
            title: `Safety Inspection - ${getInspectionTypeLabel(i.inspectionType)}`,
            description: `${i.violationsFound} violations found - Status: ${i.overallStatus}`,
            status: i.overallStatus,
            severity: i.violationsFound > 0 ? 'warning' : 'success',
            details: i
          });
        });
      }

      // Add incidents
      if (incidents.success && incidents.incidents) {
        incidents.incidents.forEach((i: any) => {
          allEvents.push({
            id: i.id,
            type: 'incident',
            date: i.incidentDate,
            title: `Incident Report - ${i.incidentType}`,
            description: i.description,
            status: i.severity,
            severity: 'error',
            details: i
          });
        });
      }

      // Add permits
      if (permits.success && permits.permits) {
        permits.permits.forEach((p: any) => {
          allEvents.push({
            id: p.id,
            type: 'permit',
            date: p.permitDate,
            title: `Work Permit - ${getPermitTypeLabel(p.permitType)}`,
            description: p.workDescription,
            status: p.status,
            details: p
          });
        });
      }

      // Sort by date descending
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to load safety timeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      toolbox: 'Toolbox Meeting',
      committee: 'Committee Meeting',
      orientation: 'Safety Orientation',
      emergency: 'Emergency Meeting'
    };
    return labels[type] || type;
  };

  const getInspectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      crane: 'Crane',
      scaffold: 'Scaffold',
      excavation: 'Excavation',
      electrical: 'Electrical',
      fire_prevention: 'Fire Prevention'
    };
    return labels[type] || type;
  };

  const getPermitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hot_work: 'Hot Work',
      confined_space: 'Confined Space',
      excavation: 'Excavation',
      electrical: 'Electrical',
      crane_lift: 'Crane Lift'
    };
    return labels[type] || type;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'inspection': return '🔍';
      case 'incident': return '⚠️';
      case 'permit': return '📝';
      case 'training': return '📚';
      case 'jha': return '🛡️';
      case 'certification': return '🪪';
      default: return '📋';
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    if (event.type === 'incident') return 'border-red-500 bg-red-50';
    if (event.severity === 'error') return 'border-red-500 bg-red-50';
    if (event.severity === 'warning') return 'border-orange-500 bg-orange-50';
    if (event.type === 'meeting') return 'border-blue-500 bg-blue-50';
    if (event.type === 'inspection' && event.status === 'pass') return 'border-green-500 bg-green-50';
    return 'border-gray-300 bg-white';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEvents = () => {
    if (filterType() === 'all') return events();
    return events().filter(e => e.type === filterType());
  };

  return (
    <div class="space-y-4">
      {/* Header */}
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Safety Activity Timeline</h2>
        <p class="text-sm text-gray-600 mt-1">Chronological view of all safety events</p>
      </div>

      {/* Filter */}
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
        <select
          value={filterType()}
          onChange={(e) => setFilterType(e.currentTarget.value)}
          class="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Activities</option>
          <option value="meeting">Safety Meetings</option>
          <option value="inspection">Inspections</option>
          <option value="incident">Incidents</option>
          <option value="permit">Work Permits</option>
          <option value="training">Training</option>
        </select>
      </div>

      {/* Loading */}
      <Show when={isLoading()}>
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-gray-600 mt-2">Loading timeline...</p>
        </div>
      </Show>

      {/* Timeline */}
      <Show when={!isLoading() && filteredEvents().length > 0}>
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="divide-y divide-gray-200">
            <For each={filteredEvents()}>
              {(event) => (
                <div
                  class={`p-6 hover:bg-gray-50 transition cursor-pointer border-l-4 ${getEventColor(event)}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div class="flex items-start gap-4">
                    <div class="flex-shrink-0 text-3xl">
                      {getEventIcon(event.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1">
                          <h3 class="text-lg font-semibold text-gray-900">{event.title}</h3>
                          <p class="text-sm text-gray-600 mt-1">{event.description}</p>
                          <div class="flex items-center gap-4 mt-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {event.type.toUpperCase()}
                            </span>
                            <Show when={event.status}>
                              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                event.status === 'pass' ? 'bg-green-100 text-green-800' :
                                event.status === 'fail' ? 'bg-red-100 text-red-800' :
                                event.status === 'conditional' ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {event.status}
                              </span>
                            </Show>
                          </div>
                        </div>
                        <div class="text-sm text-gray-500 text-right whitespace-nowrap">
                          {formatDate(event.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Summary Stats */}
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p class="text-sm text-blue-600 font-medium">Meetings</p>
            <p class="text-2xl font-bold text-blue-900 mt-1">
              {events().filter(e => e.type === 'meeting').length}
            </p>
          </div>
          <div class="bg-green-50 rounded-lg p-4 border border-green-200">
            <p class="text-sm text-green-600 font-medium">Inspections</p>
            <p class="text-2xl font-bold text-green-900 mt-1">
              {events().filter(e => e.type === 'inspection').length}
            </p>
          </div>
          <div class="bg-red-50 rounded-lg p-4 border border-red-200">
            <p class="text-sm text-red-600 font-medium">Incidents</p>
            <p class="text-2xl font-bold text-red-900 mt-1">
              {events().filter(e => e.type === 'incident').length}
            </p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p class="text-sm text-purple-600 font-medium">Permits</p>
            <p class="text-2xl font-bold text-purple-900 mt-1">
              {events().filter(e => e.type === 'permit').length}
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p class="text-sm text-gray-600 font-medium">Total Events</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">
              {events().length}
            </p>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && filteredEvents().length === 0}>
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-lg font-medium text-gray-900">No safety activities found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {filterType() !== 'all'
              ? 'Try changing your filter or start logging safety activities'
              : 'Start logging safety meetings, inspections, and other activities'}
          </p>
        </div>
      </Show>
    </div>
  );
}
