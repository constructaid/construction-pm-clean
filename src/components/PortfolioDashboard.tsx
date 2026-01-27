/**
 * Portfolio Dashboard Component
 * Displays role-specific KPIs and project overview based on PPM best practices
 */
import { createSignal, createEffect, For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import ProjectRoadmap from './ProjectRoadmap';

interface Project {
  id: number;
  name: string;
  status: string;
  progressPercentage: number;
  totalBudget: number;
  spentBudget: number;
  startDate: Date | null;
  estimatedCompletion: Date | null;
  projectNumber: string;
  address?: string;
  city?: string;
  state?: string;
}

interface PortfolioKPIs {
  health: {
    healthy: number;
    atRisk: number;
    critical: number;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    dueThisWeek: number;
  };
  progress: {
    onTrack: number;
    delayed: number;
    averageProgress: number;
  };
  time: {
    onSchedule: number;
    behindSchedule: number;
    aheadOfSchedule: number;
  };
  cost: {
    totalBudget: number;
    totalSpent: number;
    overBudget: number;
    underBudget: number;
  };
  workload: {
    activeProjects: number;
    totalTasks: number;
    resourceUtilization: number;
  };
}

interface PortfolioData {
  projects: Project[];
  kpis: PortfolioKPIs;
  summary: {
    totalProjects: number;
    totalValue: number;
    activeProjects: number;
    completedProjects: number;
  };
  roleSpecificData: any;
}

const PortfolioDashboard: Component = () => {
  const [portfolioData, setPortfolioData] = createSignal<PortfolioData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [filterStatus, setFilterStatus] = createSignal<string>('all');
  const [sortBy, setSortBy] = createSignal<'name' | 'progress' | 'budget' | 'date'>('name');

  // Fetch portfolio data
  createEffect(() => {
    fetchPortfolioData();
  });

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portfolio');

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }

      const data = await response.json();
      setPortfolioData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort projects
  const filteredProjects = () => {
    const data = portfolioData();
    if (!data) return [];

    let filtered = data.projects;

    // Apply status filter
    if (filterStatus() !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus());
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy()) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progressPercentage - a.progressPercentage;
        case 'budget':
          return b.totalBudget - a.totalBudget;
        case 'date':
          if (!a.estimatedCompletion) return 1;
          if (!b.estimatedCompletion) return -1;
          return new Date(a.estimatedCompletion).getTime() - new Date(b.estimatedCompletion).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (type: 'healthy' | 'atRisk' | 'critical') => {
    switch (type) {
      case 'healthy': return 'text-green-600';
      case 'atRisk': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  return (
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Portfolio Dashboard</h1>
          <p class="text-gray-600">Comprehensive overview of all your projects</p>
        </div>

        <Show when={loading()}>
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Show>

        <Show when={error()}>
          <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error()}
          </div>
        </Show>

        <Show when={!loading() && !error() && portfolioData()}>
          {(data) => (
            <>
              {/* Summary Cards */}
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <div class="text-sm font-medium text-gray-500 mb-1">Total Projects</div>
                  <div class="text-3xl font-bold text-gray-900">{data().summary.totalProjects}</div>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <div class="text-sm font-medium text-gray-500 mb-1">Active Projects</div>
                  <div class="text-3xl font-bold text-blue-600">{data().summary.activeProjects}</div>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <div class="text-sm font-medium text-gray-500 mb-1">Total Value</div>
                  <div class="text-3xl font-bold text-gray-900">{formatCurrency(data().summary.totalValue)}</div>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <div class="text-sm font-medium text-gray-500 mb-1">Completed</div>
                  <div class="text-3xl font-bold text-green-600">{data().summary.completedProjects}</div>
                </div>
              </div>

              {/* KPI Cards */}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Health KPI */}
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Project Health</h3>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Healthy</span>
                      <span class={`text-xl font-bold ${getHealthColor('healthy')}`}>
                        {data().kpis.health.healthy}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">At Risk</span>
                      <span class={`text-xl font-bold ${getHealthColor('atRisk')}`}>
                        {data().kpis.health.atRisk}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Critical</span>
                      <span class={`text-xl font-bold ${getHealthColor('critical')}`}>
                        {data().kpis.health.critical}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tasks KPI */}
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Tasks Overview</h3>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Total Tasks</span>
                      <span class="text-xl font-bold text-gray-900">{data().kpis.tasks.total}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Completed</span>
                      <span class="text-xl font-bold text-green-600">{data().kpis.tasks.completed}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Overdue</span>
                      <span class="text-xl font-bold text-red-600">{data().kpis.tasks.overdue}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Due This Week</span>
                      <span class="text-xl font-bold text-yellow-600">{data().kpis.tasks.dueThisWeek}</span>
                    </div>
                  </div>
                </div>

                {/* Progress KPI */}
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">On Track</span>
                      <span class="text-xl font-bold text-green-600">{data().kpis.progress.onTrack}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Delayed</span>
                      <span class="text-xl font-bold text-red-600">{data().kpis.progress.delayed}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Average</span>
                      <span class="text-xl font-bold text-blue-600">{data().kpis.progress.averageProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* Time KPI */}
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">On Schedule</span>
                      <span class="text-xl font-bold text-green-600">{data().kpis.time.onSchedule}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Behind</span>
                      <span class="text-xl font-bold text-red-600">{data().kpis.time.behindSchedule}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Ahead</span>
                      <span class="text-xl font-bold text-blue-600">{data().kpis.time.aheadOfSchedule}</span>
                    </div>
                  </div>
                </div>

                {/* Cost KPI */}
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Budget</h3>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Total Budget</span>
                      <span class="text-xl font-bold text-gray-900">{formatCurrency(data().kpis.cost.totalBudget)}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Total Spent</span>
                      <span class="text-xl font-bold text-blue-600">{formatCurrency(data().kpis.cost.totalSpent)}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Over Budget</span>
                      <span class="text-xl font-bold text-red-600">{data().kpis.cost.overBudget}</span>
                    </div>
                  </div>
                </div>

                {/* Workload KPI */}
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Workload</h3>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Active Projects</span>
                      <span class="text-xl font-bold text-blue-600">{data().kpis.workload.activeProjects}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Active Tasks</span>
                      <span class="text-xl font-bold text-gray-900">{data().kpis.workload.totalTasks}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Utilization</span>
                      <span class="text-xl font-bold text-green-600">{data().kpis.workload.resourceUtilization}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Roadmap Timeline */}
              <div class="mb-8">
                <ProjectRoadmap projects={data().projects} />
              </div>

              {/* Filters and Sort */}
              <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div class="flex flex-wrap gap-4 items-center">
                  <div>
                    <label class="text-sm font-medium text-gray-700 mr-2">Filter by Status:</label>
                    <select
                      class="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={filterStatus()}
                      onChange={(e) => setFilterStatus(e.currentTarget.value)}
                    >
                      <option value="all">All Projects</option>
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
                    <select
                      class="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={sortBy()}
                      onChange={(e) => setSortBy(e.currentTarget.value as any)}
                    >
                      <option value="name">Name</option>
                      <option value="progress">Progress</option>
                      <option value="budget">Budget</option>
                      <option value="date">Due Date</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Projects List */}
              <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h2 class="text-xl font-semibold text-gray-900">Projects ({filteredProjects().length})</h2>
                </div>
                <div class="divide-y divide-gray-200">
                  <For each={filteredProjects()}>
                    {(project) => (
                      <a
                        href={`/projects/${project.id}`}
                        class="block hover:bg-gray-50 transition-colors px-6 py-4"
                      >
                        <div class="flex items-start justify-between">
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-3 mb-2">
                              <h3 class="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
                              <span class={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span class="text-gray-500">Project #:</span>
                                <span class="ml-1 text-gray-900 font-medium">{project.projectNumber}</span>
                              </div>
                              <div>
                                <span class="text-gray-500">Progress:</span>
                                <span class="ml-1 text-gray-900 font-medium">{project.progressPercentage}%</span>
                              </div>
                              <div>
                                <span class="text-gray-500">Budget:</span>
                                <span class="ml-1 text-gray-900 font-medium">{formatCurrency(project.totalBudget)}</span>
                              </div>
                              <div>
                                <span class="text-gray-500">Due:</span>
                                <span class="ml-1 text-gray-900 font-medium">{formatDate(project.estimatedCompletion)}</span>
                              </div>
                            </div>
                            <Show when={project.address}>
                              <div class="mt-2 text-sm text-gray-600">
                                {project.address}, {project.city}, {project.state}
                              </div>
                            </Show>
                          </div>
                          <div class="ml-4">
                            <div class="w-32">
                              <div class="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{project.progressPercentage}%</span>
                              </div>
                              <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  class="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(project.progressPercentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a>
                    )}
                  </For>
                </div>
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  );
};

export default PortfolioDashboard;
