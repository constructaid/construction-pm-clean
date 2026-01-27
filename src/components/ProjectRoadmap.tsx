/**
 * Project Roadmap Component
 * Gantt-style timeline visualization for portfolio projects
 */
import { createSignal, For, Show } from 'solid-js';
import type { Component } from 'solid-js';

interface Project {
  id: number;
  name: string;
  status: string;
  startDate: Date | null;
  estimatedCompletion: Date | null;
  progressPercentage: number;
  totalBudget: number;
}

interface ProjectRoadmapProps {
  projects: Project[];
}

const ProjectRoadmap: Component<ProjectRoadmapProps> = (props) => {
  const [viewMode, setViewMode] = createSignal<'month' | 'quarter' | 'year'>('quarter');

  // Calculate timeline bounds
  const getTimelineBounds = () => {
    const dates = props.projects
      .flatMap(p => [p.startDate, p.estimatedCompletion])
      .filter((d): d is Date => d !== null)
      .map(d => new Date(d));

    if (dates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear() + 1, now.getMonth(), 1)
      };
    }

    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    start.setMonth(start.getMonth() - 1);
    end.setMonth(end.getMonth() + 2);

    return { start, end };
  };

  const bounds = () => getTimelineBounds();

  // Generate time periods based on view mode
  const getTimePeriods = () => {
    const { start, end } = bounds();
    const periods: { label: string; date: Date }[] = [];
    const mode = viewMode();

    let current = new Date(start);

    while (current <= end) {
      if (mode === 'month') {
        periods.push({
          label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          date: new Date(current)
        });
        current.setMonth(current.getMonth() + 1);
      } else if (mode === 'quarter') {
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        periods.push({
          label: `Q${quarter} ${current.getFullYear()}`,
          date: new Date(current)
        });
        current.setMonth(current.getMonth() + 3);
      } else {
        periods.push({
          label: current.getFullYear().toString(),
          date: new Date(current)
        });
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    return periods;
  };

  // Calculate position and width for a project bar
  const getProjectBarStyle = (project: Project) => {
    if (!project.startDate || !project.estimatedCompletion) {
      return { left: '0%', width: '0%', display: 'none' };
    }

    const { start, end } = bounds();
    const totalDuration = end.getTime() - start.getTime();
    const projectStart = new Date(project.startDate).getTime();
    const projectEnd = new Date(project.estimatedCompletion).getTime();

    const left = ((projectStart - start.getTime()) / totalDuration) * 100;
    const width = ((projectEnd - projectStart) / totalDuration) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.max(2, width)}%`,
      display: 'block'
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'planning': return 'bg-blue-500';
      case 'completed': return 'bg-gray-400';
      case 'on_hold': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sortedProjects = () => {
    return [...props.projects].sort((a, b) => {
      const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aStart - bStart;
    });
  };

  return (
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Project Roadmap</h2>
        <div class="flex gap-2">
          <button
            class={`px-3 py-1 text-sm rounded ${
              viewMode() === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button
            class={`px-3 py-1 text-sm rounded ${
              viewMode() === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('quarter')}
          >
            Quarter
          </button>
          <button
            class={`px-3 py-1 text-sm rounded ${
              viewMode() === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('year')}
          >
            Year
          </button>
        </div>
      </div>

      <Show when={props.projects.length === 0}>
        <div class="px-6 py-12 text-center text-gray-500">
          No projects with scheduled dates to display
        </div>
      </Show>

      <Show when={props.projects.length > 0}>
        <div class="overflow-x-auto">
          <div class="inline-block min-w-full">
            {/* Timeline header */}
            <div class="flex border-b border-gray-200 bg-gray-50">
              <div class="w-64 flex-shrink-0 px-6 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                Project
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex h-full">
                  <For each={getTimePeriods()}>
                    {(period) => (
                      <div class="flex-1 px-2 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                        {period.label}
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>

            {/* Project rows */}
            <div class="divide-y divide-gray-200">
              <For each={sortedProjects()}>
                {(project) => (
                  <div class="flex hover:bg-gray-50 transition-colors">
                    <div class="w-64 flex-shrink-0 px-6 py-4 border-r border-gray-200">
                      <a href={`/projects/${project.id}`} class="block">
                        <div class="font-medium text-gray-900 hover:text-blue-600 mb-1 truncate">
                          {project.name}
                        </div>
                        <div class="text-xs text-gray-500">
                          {formatDate(project.startDate)} - {formatDate(project.estimatedCompletion)}
                        </div>
                        <div class="mt-2">
                          <div class="flex items-center gap-2">
                            <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                class="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(project.progressPercentage, 100)}%` }}
                              ></div>
                            </div>
                            <span class="text-xs text-gray-600 tabular-nums">
                              {project.progressPercentage}%
                            </span>
                          </div>
                        </div>
                      </a>
                    </div>
                    <div class="flex-1 min-w-0 py-4 relative">
                      {/* Today marker */}
                      <Show when={(() => {
                        const now = new Date();
                        const { start, end } = bounds();
                        return now >= start && now <= end;
                      })()}>
                        {(() => {
                          const now = new Date();
                          const { start, end } = bounds();
                          const totalDuration = end.getTime() - start.getTime();
                          const left = ((now.getTime() - start.getTime()) / totalDuration) * 100;
                          return (
                            <div
                              class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                              style={{ left: `${left}%` }}
                              title="Today"
                            >
                              <div class="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                          );
                        })()}
                      </Show>

                      {/* Project bar */}
                      <Show when={project.startDate && project.estimatedCompletion}>
                        <div class="relative h-full">
                          <div
                            class={`absolute top-1/2 -translate-y-1/2 h-8 rounded ${getStatusColor(project.status)} transition-all hover:opacity-80 cursor-pointer`}
                            style={getProjectBarStyle(project)}
                            title={`${project.name} (${project.progressPercentage}%)`}
                          >
                            <div class="px-2 py-1 text-xs text-white font-medium truncate">
                              {project.progressPercentage}%
                            </div>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div class="flex flex-wrap gap-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-blue-500 rounded"></div>
              <span class="text-gray-700">Planning</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-500 rounded"></div>
              <span class="text-gray-700">Active</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-yellow-500 rounded"></div>
              <span class="text-gray-700">On Hold</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-gray-400 rounded"></div>
              <span class="text-gray-700">Completed</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-0.5 h-4 bg-red-500"></div>
              <span class="text-gray-700">Today</span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ProjectRoadmap;
