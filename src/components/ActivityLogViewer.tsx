/**
 * Activity Log Viewer Component
 * Display all project activities and communications
 */
import { createSignal, createEffect, For, Show } from 'solid-js';

interface ActivityLogViewerProps {
  projectId: string;
  entityType?: string;
  entityId?: number;
  limit?: number;
}

export default function ActivityLogViewer(props: ActivityLogViewerProps) {
  const [activities, setActivities] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [filter, setFilter] = createSignal('all');

  createEffect(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        projectId: props.projectId
      });

      if (props.entityType) {
        params.append('entityType', props.entityType);
      }
      if (props.entityId) {
        params.append('entityId', props.entityId.toString());
      }
      if (props.limit) {
        params.append('limit', props.limit.toString());
      }
      if (filter() !== 'all') {
        params.append('action', filter());
      }

      const response = await fetch(`/api/activity-log?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
    } finally {
      setLoading(false);
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return '✅';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      case 'uploaded': return '📤';
      case 'commented': return '💬';
      case 'approved': return '👍';
      case 'rejected': return '👎';
      default: return '📌';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      case 'uploaded': return 'bg-purple-100 text-purple-800';
      case 'commented': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Activity Log</h2>
        <select
          value={filter()}
          onChange={(e) => setFilter(e.currentTarget.value)}
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Activities</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="uploaded">Uploaded</option>
          <option value="commented">Commented</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Loading activity...</p>
          </div>
        }
      >
        <Show
          when={activities().length > 0}
          fallback={
            <div class="text-center py-8">
              <p class="text-gray-500">No activities to display</p>
            </div>
          }
        >
          <div class="space-y-4">
            <For each={activities()}>
              {(activity) => (
                <div class="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span class="text-2xl flex-shrink-0">{getActionIcon(activity.action)}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                      <span class={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                        {activity.action}
                      </span>
                      <span class="text-xs text-gray-500">{activity.entityType}</span>
                    </div>
                    <p class="text-sm text-gray-900 mb-1">{activity.description}</p>
                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                      <span class="font-medium">{activity.userName || `User ${activity.userId}`}</span>
                      <Show when={activity.userRole}>
                        <span>• {activity.userRole}</span>
                      </Show>
                      <span>• {formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          <Show when={activities().length >= (props.limit || 50)}>
            <div class="mt-4 text-center">
              <p class="text-sm text-gray-500">
                Showing {activities().length} most recent activities
              </p>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
