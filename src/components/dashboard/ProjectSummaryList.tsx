/**
 * Project Summary List Component
 * Displays list of projects with name, budget, progress, and quick actions
 */
import { createSignal, createEffect, For, Show } from 'solid-js';
import type { Project } from '../../lib/db/schemas/Project';

interface ProjectSummaryListProps {
  userId: string;
}

export default function ProjectSummaryList(props: ProjectSummaryListProps) {
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [searchTerm, setSearchTerm] = createSignal('');
  const [filterStatus, setFilterStatus] = createSignal('all');

  // Fetch projects on component mount
  createEffect(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects?userId=${props.userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // Filter projects based on search and status
  const filteredProjects = () => {
    return projects().filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm().toLowerCase());
      const matchesStatus = filterStatus() === 'all' || project.status === filterStatus();
      return matchesSearch && matchesStatus;
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'planning': 'bg-blue-100 text-blue-800',
      'bidding': 'bg-purple-100 text-purple-800',
      'pre_construction': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-green-100 text-green-800',
      'closeout': 'bg-orange-100 text-orange-800',
      'completed': 'bg-gray-100 text-gray-800',
      'on_hold': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      {/* Search and Filter */}
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <div class="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus()}
          onChange={(e) => setFilterStatus(e.currentTarget.value)}
          class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="bidding">Bidding</option>
          <option value="pre_construction">Pre-Construction</option>
          <option value="in_progress">In Progress</option>
          <option value="closeout">Closeout</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Loading State */}
      <Show when={loading()}>
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-orange border-t-transparent"></div>
          <p class="text-text-secondary mt-2">Loading projects...</p>
        </div>
      </Show>

      {/* Error State */}
      <Show when={error()}>
        <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error()}
        </div>
      </Show>

      {/* Projects List */}
      <Show when={!loading() && !error()}>
        <Show
          when={filteredProjects().length > 0}
          fallback={
            <div class="text-center py-8 text-text-secondary">
              <p>No projects found.</p>
              <a href="/projects/new" class="text-primary-orange hover:underline mt-2 inline-block">
                Create your first project
              </a>
            </div>
          }
        >
          <div class="space-y-4">
            <For each={filteredProjects()}>
              {(project) => (
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-ca-sm transition-shadow">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <h3 class="font-semibold text-text-primary mb-1">
                        <a href={`/projects/${project._id}`} class="hover:text-primary-orange">
                          {project.name}
                        </a>
                      </h3>
                      <p class="text-sm text-text-secondary">{project.location.city}, {project.location.state}</p>
                    </div>
                    <span class={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div class="mb-3">
                    <div class="flex items-center justify-between text-sm mb-1">
                      <span class="text-text-secondary">Progress</span>
                      <span class="font-medium text-text-primary">{project.progress.percentage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-primary-orange h-2 rounded-full transition-all"
                        style={`width: ${project.progress.percentage}%`}
                      ></div>
                    </div>
                  </div>

                  {/* Budget Info */}
                  <div class="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p class="text-xs text-text-secondary">Total Budget</p>
                      <p class="text-sm font-semibold text-text-primary">{formatCurrency(project.budget.total)}</p>
                    </div>
                    <div>
                      <p class="text-xs text-text-secondary">Spent</p>
                      <p class="text-sm font-semibold text-text-primary">{formatCurrency(project.budget.spent)}</p>
                    </div>
                    <div>
                      <p class="text-xs text-text-secondary">Remaining</p>
                      <p class="text-sm font-semibold text-green-600">{formatCurrency(project.budget.remaining)}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div class="flex items-center space-x-2 pt-3 border-t border-gray-100">
                    <a
                      href={`/projects/${project._id}`}
                      class="text-sm text-primary-orange hover:underline font-medium"
                    >
                      View Details
                    </a>
                    <span class="text-gray-300">•</span>
                    <a
                      href={`/projects/${project._id}/tasks`}
                      class="text-sm text-primary-orange hover:underline font-medium"
                    >
                      Tasks
                    </a>
                    <span class="text-gray-300">•</span>
                    <a
                      href={`/projects/${project._id}/documents`}
                      class="text-sm text-primary-orange hover:underline font-medium"
                    >
                      Documents
                    </a>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}
