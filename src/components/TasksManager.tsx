/**
 * Tasks Manager Component
 * Full page task management with filtering, search, and CRUD operations
 */
import { createSignal, createEffect, For, Show } from 'solid-js';
import type { Task } from '../lib/db/schemas/Task';

interface TasksManagerProps {
  userId: string;
}

export default function TasksManager(props: TasksManagerProps) {
  const [tasks, setTasks] = createSignal<Task[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [searchTerm, setSearchTerm] = createSignal('');
  const [statusFilter, setStatusFilter] = createSignal('all');
  const [priorityFilter, setPriorityFilter] = createSignal('all');
  const [showAddModal, setShowAddModal] = createSignal(false);

  // Fetch tasks
  createEffect(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?userId=${props.userId}&filter=all`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  });

  // Filter tasks
  const filteredTasks = () => {
    return tasks().filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm().toLowerCase());
      const matchesStatus = statusFilter() === 'all' || task.status === statusFilter();
      const matchesPriority = priorityFilter() === 'all' || task.priority === priorityFilter();
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  // Calculate statistics
  const stats = () => {
    const allTasks = tasks();
    return {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length
    };
  };

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    const task = tasks().find(t => t._id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      setTasks(tasks().map(t =>
        t._id === taskId ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'blocked': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-500'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Priority badge color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'urgent': 'bg-red-100 text-red-800',
      'high': 'bg-orange-100 text-orange-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Format due date
  const formatDueDate = (dueDate: Date | undefined) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Check if overdue
  const isOverdue = (dueDate: Date | undefined, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div>
      {/* Filters */}
      <div class="bg-white rounded-lg shadow-ca-sm p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Search Tasks</label>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Status</label>
            <select
              value={statusFilter()}
              onChange={(e) => setStatusFilter(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Priority</label>
            <select
              value={priorityFilter()}
              onChange={(e) => setPriorityFilter(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-ca-sm p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg p-3 bg-primary-orange bg-opacity-10">
              <svg class="h-8 w-8 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-text-secondary">Total Tasks</p>
              <p class="text-2xl font-bold text-text-primary">{stats().total}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-ca-sm p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg p-3 bg-blue-100">
              <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-text-secondary">In Progress</p>
              <p class="text-2xl font-bold text-blue-600">{stats().inProgress}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-ca-sm p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg p-3 bg-green-100">
              <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-text-secondary">Completed</p>
              <p class="text-2xl font-bold text-green-600">{stats().completed}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-ca-sm p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg p-3 bg-gray-100">
              <svg class="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-text-secondary">Pending</p>
              <p class="text-2xl font-bold text-gray-600">{stats().pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div class="bg-white rounded-lg shadow-ca-md">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-text-primary">All Tasks</h2>
            <button
              onClick={() => setShowAddModal(true)}
              class="bg-primary-orange text-white px-4 py-2 rounded-md hover:bg-opacity-90 font-medium"
            >
              + Add New Task
            </button>
          </div>
        </div>

        <div class="p-6">
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
                  <p>No tasks found.</p>
                </div>
              }
            >
              <div class="space-y-4">
                <For each={filteredTasks()}>
                  {(task) => (
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-ca-sm transition-shadow">
                      <div class="flex items-start justify-between">
                        <div class="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => toggleTask(task._id)}
                            class="mt-1 w-5 h-5 text-primary-orange border-gray-300 rounded focus:ring-primary-orange cursor-pointer"
                          />
                          <div class="flex-1">
                            <h3
                              class={`text-base font-semibold ${
                                task.status === 'completed' ? 'line-through text-gray-400' : 'text-text-primary'
                              }`}
                            >
                              {task.title}
                            </h3>
                            {task.description && (
                              <p class="text-sm text-text-secondary mt-1">{task.description}</p>
                            )}
                            <div class="flex items-center flex-wrap gap-2 mt-2">
                              <span class={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span class={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                              </span>
                              {task.dueDate && (
                                <span
                                  class={`text-xs ${
                                    isOverdue(task.dueDate, task.status)
                                      ? 'text-red-600 font-semibold'
                                      : 'text-text-secondary'
                                  }`}
                                >
                                  📅 {formatDueDate(task.dueDate)}
                                  {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                                </span>
                              )}
                              {task.autoGenerated && (
                                <span class="text-xs text-blue-600" title="Auto-generated from project milestone">
                                  🤖 Auto-generated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </div>
      </div>

      {/* Add Task Modal - Placeholder */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-text-primary mb-4">Add New Task</h3>
            <p class="text-text-secondary mb-4">Task creation form coming soon...</p>
            <div class="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                class="px-4 py-2 border border-gray-300 rounded-md text-text-secondary hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
