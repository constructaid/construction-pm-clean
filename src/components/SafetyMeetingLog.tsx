/**
 * Safety Meeting Log Component
 * Displays list of safety meetings with filtering and details
 */
import { createSignal, onMount, For, Show } from 'solid-js';

interface SafetyMeetingLogProps {
  projectId: number;
  onCreateNew: () => void;
}

export default function SafetyMeetingLog(props: SafetyMeetingLogProps) {
  const [meetings, setMeetings] = createSignal<any[]>([]);
  const [filteredMeetings, setFilteredMeetings] = createSignal<any[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [searchTerm, setSearchTerm] = createSignal('');
  const [filterType, setFilterType] = createSignal<string>('all');
  const [selectedMeeting, setSelectedMeeting] = createSignal<any>(null);

  onMount(async () => {
    await loadMeetings();
  });

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/safety/meetings?projectId=${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMeetings(data.meetings || []);
          setFilteredMeetings(data.meetings || []);
        }
      }
    } catch (err) {
      console.error('Failed to load safety meetings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, filterType());
  };

  const handleFilterType = (type: string) => {
    setFilterType(type);
    applyFilters(searchTerm(), type);
  };

  const applyFilters = (search: string, type: string) => {
    let filtered = [...meetings()];

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(m => m.meetingType === type);
    }

    // Filter by search term
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.topic?.toLowerCase().includes(term) ||
        m.meetingNumber?.toLowerCase().includes(term) ||
        m.conductorName?.toLowerCase().includes(term)
      );
    }

    setFilteredMeetings(filtered);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'toolbox': return 'bg-blue-100 text-blue-800';
      case 'committee': return 'bg-purple-100 text-purple-800';
      case 'orientation': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'toolbox': return 'Toolbox';
      case 'committee': return 'Committee';
      case 'orientation': return 'Orientation';
      case 'emergency': return 'Emergency';
      default: return type;
    }
  };

  return (
    <div class="space-y-4">
      {/* Header with Create Button */}
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Safety Meetings</h2>
          <p class="text-sm text-gray-600 mt-1">DISD Exhibit 7-1 - Safety Meeting Attendance Roster</p>
        </div>
        <button
          onClick={props.onCreateNew}
          class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
        >
          + Schedule Meeting
        </button>
      </div>

      {/* DISD Compliance Reminder */}
      <div class="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <p class="text-sm font-semibold text-blue-900">Weekly Toolbox Meetings Required</p>
            <p class="text-sm text-blue-800 mt-1">
              DISD requires weekly toolbox safety meetings with minimum 15-minute duration. All workers must attend and sign in with badge numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by topic, number, or conductor..."
              value={searchTerm()}
              onInput={(e) => handleSearch(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={filterType()}
              onChange={(e) => handleFilterType(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Meeting Types</option>
              <option value="toolbox">Toolbox Meetings</option>
              <option value="committee">Committee Meetings</option>
              <option value="orientation">Orientation</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meeting List */}
      <Show when={isLoading()}>
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-gray-600 mt-2">Loading meetings...</p>
        </div>
      </Show>

      <Show when={!isLoading() && filteredMeetings().length === 0}>
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 class="mt-2 text-lg font-medium text-gray-900">No safety meetings found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {searchTerm() || filterType() !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Get started by scheduling your first safety meeting'}
          </p>
          <Show when={!searchTerm() && filterType() === 'all'}>
            <button
              onClick={props.onCreateNew}
              class="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Schedule Meeting
            </button>
          </Show>
        </div>
      </Show>

      <Show when={!isLoading() && filteredMeetings().length > 0}>
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meeting #
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendees
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conductor
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <For each={filteredMeetings()}>
                  {(meeting) => (
                    <tr class="hover:bg-gray-50 transition">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {meeting.meetingNumber}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMeetingTypeColor(meeting.meetingType)}`}>
                          {getMeetingTypeLabel(meeting.meetingType)}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(meeting.meetingDate)}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-900">
                        {meeting.topic}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {meeting.duration} min
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {meeting.attendanceCount}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-900">
                        {meeting.conductorName || 'N/A'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedMeeting(meeting)}
                          class="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p class="text-sm text-blue-600 font-medium">Total Meetings</p>
            <p class="text-2xl font-bold text-blue-900 mt-1">{meetings().length}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4 border border-green-200">
            <p class="text-sm text-green-600 font-medium">Toolbox Meetings</p>
            <p class="text-2xl font-bold text-green-900 mt-1">
              {meetings().filter(m => m.meetingType === 'toolbox').length}
            </p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p class="text-sm text-purple-600 font-medium">Committee Meetings</p>
            <p class="text-2xl font-bold text-purple-900 mt-1">
              {meetings().filter(m => m.meetingType === 'committee').length}
            </p>
          </div>
          <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p class="text-sm text-orange-600 font-medium">Total Attendees</p>
            <p class="text-2xl font-bold text-orange-900 mt-1">
              {meetings().reduce((sum, m) => sum + (m.attendanceCount || 0), 0)}
            </p>
          </div>
        </div>
      </Show>

      {/* Meeting Details Modal */}
      <Show when={selectedMeeting()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bold text-gray-900">{selectedMeeting()?.topic}</h3>
                <p class="text-sm text-gray-600 mt-1">{selectedMeeting()?.meetingNumber}</p>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-6">
              {/* Meeting Info */}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm font-medium text-gray-500">Date</p>
                  <p class="text-base text-gray-900">{formatDate(selectedMeeting()?.meetingDate)}</p>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-500">Duration</p>
                  <p class="text-base text-gray-900">{selectedMeeting()?.duration} minutes</p>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-500">Type</p>
                  <p class="text-base text-gray-900">{getMeetingTypeLabel(selectedMeeting()?.meetingType)}</p>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-500">Conducted By</p>
                  <p class="text-base text-gray-900">{selectedMeeting()?.conductorName || 'N/A'}</p>
                </div>
                <Show when={selectedMeeting()?.location}>
                  <div class="col-span-2">
                    <p class="text-sm font-medium text-gray-500">Location</p>
                    <p class="text-base text-gray-900">{selectedMeeting()?.location}</p>
                  </div>
                </Show>
              </div>

              {/* Discussion */}
              <div>
                <p class="text-sm font-medium text-gray-500 mb-2">Discussion</p>
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p class="text-gray-900 whitespace-pre-wrap">{selectedMeeting()?.discussion}</p>
                </div>
              </div>

              {/* Attendees */}
              <div>
                <p class="text-sm font-medium text-gray-500 mb-2">
                  Attendees ({selectedMeeting()?.attendanceCount || 0})
                </p>
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-60 overflow-y-auto">
                  <Show when={selectedMeeting()?.attendees && JSON.parse(selectedMeeting()?.attendees).length > 0}>
                    <div class="space-y-2">
                      <For each={JSON.parse(selectedMeeting()?.attendees || '[]')}>
                        {(attendee: any) => (
                          <div class="flex justify-between items-center text-sm">
                            <span class="font-medium text-gray-900">{attendee.name}</span>
                            <span class="text-gray-600">{attendee.company}</span>
                            <Show when={attendee.badgeNumber}>
                              <span class="text-gray-500">Badge: {attendee.badgeNumber}</span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
