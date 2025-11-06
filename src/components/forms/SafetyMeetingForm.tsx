/**
 * Safety Meeting Form Component
 * For scheduling and documenting toolbox and committee safety meetings
 * Corresponds to DISD Exhibit 7-1 - Safety Meeting Attendance Roster Form
 */
import { createSignal, For, Show } from 'solid-js';

interface SafetyMeetingFormProps {
  projectId: number;
  projectInfo?: any;
  meetingNumber?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Attendee {
  name: string;
  company: string;
  badgeNumber: string;
  signature: string;
}

export default function SafetyMeetingForm(props: SafetyMeetingFormProps) {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');
  const [attendees, setAttendees] = createSignal<Attendee[]>([]);
  const [actionItems, setActionItems] = createSignal<string[]>([]);

  // Form fields
  const [meetingType, setMeetingType] = createSignal<'toolbox' | 'committee' | 'orientation' | 'emergency'>('toolbox');
  const [meetingDate, setMeetingDate] = createSignal('');
  const [meetingTime, setMeetingTime] = createSignal('');
  const [duration, setDuration] = createSignal(15); // Minimum 15 minutes for toolbox
  const [topic, setTopic] = createSignal('');
  const [location, setLocation] = createSignal('');
  const [agenda, setAgenda] = createSignal('');
  const [discussion, setDiscussion] = createSignal('');
  const [conductorName, setConductorName] = createSignal('');

  const addAttendee = () => {
    setAttendees([...attendees(), { name: '', company: '', badgeNumber: '', signature: '' }]);
  };

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updated = [...attendees()];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees().filter((_, i) => i !== index));
  };

  const addActionItem = () => {
    setActionItems([...actionItems(), '']);
  };

  const updateActionItem = (index: number, value: string) => {
    const updated = [...actionItems()];
    updated[index] = value;
    setActionItems(updated);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems().filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!topic()) {
      setError('Meeting topic is required');
      return;
    }

    if (!discussion()) {
      setError('Meeting discussion is required');
      return;
    }

    if (!meetingDate()) {
      setError('Meeting date is required');
      return;
    }

    if (meetingType() === 'toolbox' && duration() < 15) {
      setError('Toolbox meetings must be at least 15 minutes (DISD requirement)');
      return;
    }

    if (attendees().length === 0) {
      setError('At least one attendee is required');
      return;
    }

    // Check all attendees have required fields
    const invalidAttendee = attendees().find(a => !a.name || !a.company);
    if (invalidAttendee) {
      setError('All attendees must have name and company');
      return;
    }

    setIsSubmitting(true);

    try {
      const meetingData = {
        projectId: props.projectId,
        meetingNumber: props.meetingNumber || `SM-${Date.now()}`,
        meetingType: meetingType(),
        meetingDate: new Date(`${meetingDate()}T${meetingTime() || '00:00'}`).toISOString(),
        duration: duration(),
        topic: topic(),
        location: location(),
        agenda: agenda(),
        discussion: discussion(),
        conductorName: conductorName(),
        attendees: attendees(),
        actionItems: actionItems().filter(item => item.trim() !== ''),
        attendanceCount: attendees().length,
        isMandatory: meetingType() === 'toolbox' || meetingType() === 'committee',
      };

      const response = await fetch('/api/safety/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save safety meeting');
      }

      if (props.onSuccess) {
        props.onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save safety meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {/* DISD Compliance Notice */}
      <div class="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-semibold text-blue-900">DISD Safety Meeting Requirements</h3>
            <p class="text-sm text-blue-800 mt-1">
              <strong>Weekly toolbox meetings are MANDATORY</strong> - Minimum 15 minutes duration required
            </p>
          </div>
        </div>
      </div>

      <Show when={error()}>
        <div class="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <p class="text-sm text-red-800">{error()}</p>
        </div>
      </Show>

      {/* Meeting Basic Information */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Meeting Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Meeting Type *
            </label>
            <select
              value={meetingType()}
              onInput={(e) => setMeetingType(e.currentTarget.value as any)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="toolbox">Toolbox Meeting (Weekly - MANDATORY)</option>
              <option value="committee">Safety Committee Meeting (Monthly)</option>
              <option value="orientation">Safety Orientation</option>
              <option value="emergency">Emergency Meeting</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Meeting Number
            </label>
            <input
              type="text"
              value={props.meetingNumber || ''}
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Meeting Date *
            </label>
            <input
              type="date"
              value={meetingDate()}
              onInput={(e) => setMeetingDate(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Meeting Time
            </label>
            <input
              type="time"
              value={meetingTime()}
              onInput={(e) => setMeetingTime(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes) *
              <Show when={meetingType() === 'toolbox'}>
                <span class="text-red-600 text-xs ml-1">(Minimum 15 required)</span>
              </Show>
            </label>
            <input
              type="number"
              value={duration()}
              onInput={(e) => setDuration(parseInt(e.currentTarget.value) || 15)}
              min={meetingType() === 'toolbox' ? 15 : 1}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location()}
              onInput={(e) => setLocation(e.currentTarget.value)}
              placeholder="Job site trailer, etc."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Conducted By *
            </label>
            <input
              type="text"
              value={conductorName()}
              onInput={(e) => setConductorName(e.currentTarget.value)}
              placeholder="Site supervisor name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Meeting Content */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Meeting Content</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Topic *
            </label>
            <input
              type="text"
              value={topic()}
              onInput={(e) => setTopic(e.currentTarget.value)}
              placeholder="e.g., Fall Protection, Electrical Safety, Housekeeping"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Agenda
            </label>
            <textarea
              value={agenda()}
              onInput={(e) => setAgenda(e.currentTarget.value)}
              rows={3}
              placeholder="Meeting agenda items..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Discussion Summary *
            </label>
            <textarea
              value={discussion()}
              onInput={(e) => setDiscussion(e.currentTarget.value)}
              rows={5}
              placeholder="Detailed discussion of safety topics covered..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Attendance Roster */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Attendance Roster</h3>
          <button
            type="button"
            onClick={addAttendee}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Add Attendee
          </button>
        </div>

        <Show when={attendees().length === 0}>
          <p class="text-gray-500 text-center py-8">No attendees added yet. Click "Add Attendee" to begin.</p>
        </Show>

        <div class="space-y-3">
          <For each={attendees()}>
            {(attendee, index) => (
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={attendee.name}
                      onInput={(e) => updateAttendee(index(), 'name', e.currentTarget.value)}
                      placeholder="Worker name"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Company *</label>
                    <input
                      type="text"
                      value={attendee.company}
                      onInput={(e) => updateAttendee(index(), 'company', e.currentTarget.value)}
                      placeholder="Company name"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Badge # (DISD)</label>
                    <input
                      type="text"
                      value={attendee.badgeNumber}
                      onInput={(e) => updateAttendee(index(), 'badgeNumber', e.currentTarget.value)}
                      placeholder="Badge number"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div class="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeAttendee(index())}
                      class="w-full px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        <Show when={attendees().length > 0}>
          <div class="mt-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-900">
              <strong>Total Attendees:</strong> {attendees().length}
            </p>
          </div>
        </Show>
      </div>

      {/* Action Items */}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Action Items</h3>
          <button
            type="button"
            onClick={addActionItem}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            + Add Action Item
          </button>
        </div>

        <Show when={actionItems().length === 0}>
          <p class="text-gray-500 text-center py-4 text-sm">No action items. Add any follow-up tasks identified during the meeting.</p>
        </Show>

        <div class="space-y-2">
          <For each={actionItems()}>
            {(item, index) => (
              <div class="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onInput={(e) => updateActionItem(index(), e.currentTarget.value)}
                  placeholder="Action item description..."
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => removeActionItem(index())}
                  class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </For>
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
          class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting()}
        >
          {isSubmitting() ? 'Saving...' : 'Save Safety Meeting'}
        </button>
      </div>
    </form>
  );
}
