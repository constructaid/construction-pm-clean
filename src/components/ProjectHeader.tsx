/**
 * Project Header Component
 * Displays project name, breadcrumb navigation, and project dropdown menu
 */
import { createSignal, onMount, Show, For } from 'solid-js';

interface ProjectHeaderProps {
  projectId: string;
  moduleName: string;
  moduleIcon?: string;
}

interface Project {
  id: number;
  name: string;
  projectNumber: string;
}

export default function ProjectHeader(props: ProjectHeaderProps) {
  const [projectName, setProjectName] = createSignal<string>('Loading...');
  const [projectNumber, setProjectNumber] = createSignal<string>('');
  const [loading, setLoading] = createSignal(true);
  const [allProjects, setAllProjects] = createSignal<Project[]>([]);
  const [showDropdown, setShowDropdown] = createSignal(false);

  onMount(async () => {
    try {
      // Load current project
      const response = await fetch(`/api/projects/${props.projectId}`);
      const data = await response.json();

      if (data.success && data.data?.project) {
        setProjectName(data.data.project.name);
        setProjectNumber(data.data.project.projectNumber);
      }

      // Load all projects for dropdown
      const projectsResponse = await fetch('/api/projects');
      const projectsData = await projectsResponse.json();

      if (projectsData.success && projectsData.data?.projects) {
        setAllProjects(projectsData.data.projects);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setProjectName('Unknown Project');
    } finally {
      setLoading(false);
    }
  });

  const handleProjectSwitch = (projectId: number) => {
    // Determine the current module path
    const currentPath = window.location.pathname;
    const modulePath = currentPath.split('/').slice(3).join('/'); // Gets "submittals", "rfis", etc.

    // Navigate to same module but different project
    window.location.href = `/projects/${projectId}/${modulePath}`;
  };

  return (
    <div class="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          {/* Left: Breadcrumb */}
          <div class="flex items-center space-x-2 text-sm">
            <a href="/projects" class="text-gray-600 hover:text-gray-900 transition-colors">
              Projects
            </a>
            <span class="text-gray-400">/</span>
            <Show when={!loading()} fallback={<span class="text-gray-400">Loading...</span>}>
              <a
                href={`/projects/${props.projectId}`}
                class="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                {projectName()}
                <Show when={projectNumber()}>
                  <span class="text-gray-400 ml-2 text-xs">({projectNumber()})</span>
                </Show>
              </a>
            </Show>
            <span class="text-gray-400">/</span>
            <span class="text-gray-900 font-semibold flex items-center gap-1">
              <Show when={props.moduleIcon}>
                <span>{props.moduleIcon}</span>
              </Show>
              {props.moduleName}
            </span>
          </div>

          {/* Right: Project Dropdown + Info Badge */}
          <Show when={!loading()}>
            <div class="flex items-center gap-3">
              {/* Project Dropdown */}
              <div class="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown())}
                  class="inline-flex items-center gap-2 px-4 py-2 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all shadow-md font-medium text-sm"
                  title="Switch Project"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01"></path>
                  </svg>
                  <span class="hidden md:inline">Switch Project</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <Show when={showDropdown()}>
                  <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    <div class="px-4 py-2 border-b border-gray-200">
                      <div class="text-xs font-semibold text-gray-500 uppercase">Switch to Project</div>
                    </div>
                    <For each={allProjects()}>
                      {(project) => (
                        <button
                          onClick={() => {
                            handleProjectSwitch(project.id);
                            setShowDropdown(false);
                          }}
                          class={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            project.id === parseInt(props.projectId) ? 'bg-ca-teal bg-opacity-10' : ''
                          }`}
                        >
                          <div class="flex items-center justify-between">
                            <div class="flex-1">
                              <div class="font-medium text-gray-900">{project.name}</div>
                              <div class="text-xs text-gray-500 mt-0.5">#{project.projectNumber}</div>
                            </div>
                            <Show when={project.id === parseInt(props.projectId)}>
                              <svg class="w-5 h-5 text-ca-teal" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                              </svg>
                            </Show>
                          </div>
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Project Info Badge */}
              <a
                href={`/projects/${props.projectId}`}
                class="hidden lg:inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                title="View Project Dashboard"
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Dashboard
              </a>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
