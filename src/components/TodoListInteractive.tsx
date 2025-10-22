/**
 * Interactive To-Do List Component (SolidJS)
 * Real-time task management with auto-population from milestones
 * Supports polling for updates (WebSocket support ready to add)
 */
import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js';
import type { Task, TaskStatus, TaskPriority } from '../lib/db/schemas/Task';

interface TodoListInteractiveProps {
  userId: string;
  projectId?: string;
  maxItems?: number;
}

export default function TodoListInteractive(props: TodoListInteractiveProps) {
  const [tasks, setTasks] = createSignal<Task[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [filter, setFilter] = createSignal<'all' | 'today' | 'week' | 'overdue'>('today');
  const [priorityFilter, setPriorityFilter] = createSignal<string>('all');
  const [searchQuery, setSearchQuery] = createSignal('');

  // Polling interval (30 seconds)
  const POLL_INTERVAL = 30000;
  let pollTimer: number;

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({
        userId: props.userId,
        filter: filter()
      });

      if (props.projectId) {
        params.append('projectId', props.projectId);
      }

      const response = await fetch(`/api/tasks?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and set up polling
  createEffect(() => {
    fetchTasks();

    // Set up polling for real-time updates
    pollTimer = window.setInterval(() => {
      fetchTasks();
    }, POLL_INTERVAL);

    // Cleanup on unmount
    onCleanup(() => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    });
  });

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    const task = tasks().find(t => t._id === taskId);
    if (!task) return;

    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setTasks(tasks().map(t =>
          t._id === taskId ? { ...t, status: newStatus } : t
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = () => {
    let filtered = tasks();

    // Apply search filter
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Apply priority filter
    if (priorityFilter() !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter());
    }

    // Limit items
    if (props.maxItems) {
      filtered = filtered.slice(0, props.maxItems);
    }

    return filtered;
  };

  // Get priority badge color
  const getPriorityColor = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      'urgent': 'bg-red-100 text-red-800 border-red-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[priority];
  };

  // Format due date
  const formatDueDate = (dueDate: Date | undefined) => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Check if overdue
  const isOverdue = (dueDate: Date | undefined, status: TaskStatus) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchTasks();
  };

  return (
    <div class="space-y-4">
      {/* Filters */}
      <div class="flex flex-wrap gap-3 items-center">
        {/* Time Filter */}
        <div class="flex space-x-2">
          <button
            onClick={() => setFilter('today')}
            class={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter() === 'today'
                ? 'bg-primary-orange text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('week')}
            class={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter() === 'week'
                ? 'bg-primary-orange text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilter('overdue')}
            class={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter() === 'overdue'
                ? 'bg-primary-orange text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setFilter('all')}
            class={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter() === 'all'
                ? 'bg-primary-orange text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter()}
          onChange={(e) => setPriorityFilter(e.currentTarget.value)}
          class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          class="ml-auto p-2 text-text-secondary hover:text-primary-orange transition-colors"
          title="Refresh tasks"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
        />
      </div>

      {/* Tasks List */}
      <Show when={loading()}>
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-orange border-t-transparent"></div>
          <p class="text-text-secondary mt-2">Loading tasks...</p>
        </div>
      </Show>

      <Show when={!loading()}>
        <Show
          when={filteredTasks().length > 0}
          fallback={
            <div class="text-center py-8 text-text-secondary">
              <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="font-medium mb-1">No tasks found</p>
              <p class="text-sm">Try adjusting your filters or check back later</p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={filteredTasks()}>
              {(task) => (
                <div
                  class={`border rounded-lg p-4 transition-all ${
                    task.status === 'completed'
                      ? 'bg-gray-50 border-gray-200'
                      : isOverdue(task.dueDate, task.status)
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200 hover:shadow-ca-sm'
                  }`}
                >
                  <div class="flex items-start space-x-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleTask(task._id)}
                      class="mt-1 w-5 h-5 text-primary-orange border-gray-300 rounded focus:ring-primary-orange cursor-pointer"
                    />

                    {/* Task Content */}
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between mb-2">
                        <h4
                          class={`font-medium ${
                            task.status === 'completed'
                              ? 'line-through text-text-secondary'
                              : 'text-text-primary'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Task Meta */}
                      <div class="flex flex-wrap items-center gap-2">
                        <span class={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>

                        {task.dueDate && (
                          <span
                            class={`text-xs px-2 py-1 rounded-full ${
                              isOverdue(task.dueDate, task.status)
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-text-secondary'
                            }`}
                          >
                            📅 {formatDueDate(task.dueDate)}
                          </span>
                        )}

                        {task.type && task.type !== 'general' && (
                          <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {task.type.replace('_', ' ').toUpperCase()}
                          </span>
                        )}

                        {task.autoGenerated && (
                          <span class="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800" title="Auto-generated from milestone">
                            🤖 Auto
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <Show when={task.description}>
                        <p class="text-sm text-text-secondary mt-2 line-clamp-2">{task.description}</p>
                      </Show>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* View All Link */}
      <div class="text-center pt-2">
        <a href="/tasks" class="text-sm text-primary-orange hover:underline font-medium">
          View All Tasks →
        </a>
      </div>

      {/* Auto-refresh indicator */}
      <div class="text-center text-xs text-text-secondary">
        Auto-refreshing every {POLL_INTERVAL / 1000} seconds
      </div>
    </div>
  );
}
