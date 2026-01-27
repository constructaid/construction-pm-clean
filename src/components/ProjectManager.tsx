import { createSignal, For, Show, onMount } from 'solid-js';
import ProjectHealthCard from './ProjectHealthCard';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  budget: number;
  location: string;
  startDate: string;
  endDate?: string;
}

// Global project store
const [projects, setProjects] = createSignal<Project[]>([
  {
    id: '1',
    name: 'Downtown Office Complex',
    description: 'Modern office building with sustainable features',
    status: 'in_progress',
    budget: 2500000,
    location: 'Downtown Seattle',
    startDate: '2024-01-15'
  },
  {
    id: '2',
    name: 'Residential Housing Development',
    description: 'Family-friendly housing complex with 50 units',
    status: 'planning',
    budget: 5000000,
    location: 'Bellevue, WA',
    startDate: '2024-03-01'
  },
  {
    id: '3',
    name: 'Shopping Mall Renovation',
    description: 'Complete renovation of existing shopping center',
    status: 'completed',
    budget: 1800000,
    location: 'Tacoma, WA',
    startDate: '2023-08-01',
    endDate: '2023-12-15'
  }
]);

export function addProject(project: Omit<Project, 'id'>) {
  const newProject: Project = {
    ...project,
    id: Date.now().toString()
  };
  setProjects(prev => [...prev, newProject]);
  return newProject;
}

export function getProjects() {
  return projects();
}

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'completed': return 'text-white'; // Will use inline style for bg
    case 'in_progress': return 'text-white'; // Will use inline style for bg
    case 'planning': return 'text-white'; // Will use inline style for bg
    case 'on_hold': return 'text-gray-800'; // Will use inline style for bg
    case 'cancelled': return 'text-white'; // Will use inline style for bg
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusBg = (status: Project['status']) => {
  switch (status) {
    case 'completed': return '#3D9991'; // ConstructAid teal
    case 'in_progress': return '#4BAAD8'; // ConstructAid blue
    case 'planning': return '#FF6600'; // Safety orange
    case 'on_hold': return '#FFB81C'; // Warning yellow
    case 'cancelled': return '#E6332A'; // Error red
    default: return '#6B6B6B';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export function ProjectList() {
  const [searchTerm, setSearchTerm] = createSignal('');
  const [statusFilter, setStatusFilter] = createSignal<string>('all');
  const [archivedFilter, setArchivedFilter] = createSignal<string>('false');
  const [minBudget, setMinBudget] = createSignal('');
  const [maxBudget, setMaxBudget] = createSignal('');
  const [dbProjects, setDbProjects] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [totalCount, setTotalCount] = createSignal(0);
  const [currentUserId, setCurrentUserId] = createSignal<string>('');
  let searchTimeout: number | undefined;

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        // Handle both {user: {...}} and direct user object formats
        const user = data.user || data;
        if (user && user.id) {
          setCurrentUserId(user.id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  // Fetch projects from database with filters
  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Don't send userId - let the backend use the authenticated user from session
      const params = new URLSearchParams({
        status: statusFilter() || 'all',
        archived: archivedFilter() || 'false',
      });

      // Add search parameter if provided
      if (searchTerm().trim()) {
        params.append('search', searchTerm().trim());
      }

      // Add budget filters if provided
      if (minBudget()) {
        params.append('minBudget', minBudget());
      }
      if (maxBudget()) {
        params.append('maxBudget', maxBudget());
      }

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        console.log('[ProjectList] Received data from API:', result);
        // Handle apiHandler wrapper structure: {success: true, data: {projects: [], pagination: {}}}
        const data = result.data || result;
        console.log('[ProjectList] Projects count:', data.projects?.length || 0);
        setDbProjects(data.projects || []);
        setTotalCount(data.pagination?.total || 0);
        console.log('[ProjectList] dbProjects() after setting:', dbProjects());
      } else {
        console.error('[ProjectList] API response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects on mount
  onMount(() => {
    fetchProjects();
  });

  // Debounced search - refetch after user stops typing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchProjects();
    }, 500) as unknown as number; // 500ms debounce
  };

  // Refetch when filters change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    fetchProjects();
  };

  const handleArchivedChange = (value: string) => {
    setArchivedFilter(value);
    fetchProjects();
  };

  const handleBudgetChange = () => {
    fetchProjects();
  };

  return (
    <div class="bg-gray-900 min-h-screen">
      <div class="max-w-7xl mx-auto py-6 px-6">
        {/* Header */}
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-semibold text-white">Projects</h1>
            <p class="mt-1 text-gray-400">Manage and track all construction projects</p>
          </div>
          <a
            href="/projects/new"
            class="bg-ca-orange hover:bg-ca-orange-dark text-white px-5 py-2.5 rounded font-medium transition-all shadow-ca-sm hover:shadow-ca-md"
          >
            + New Project
          </a>
        </div>

        {/* Filters */}
        <div class="bg-white rounded shadow-ca-sm p-5 mb-6 border border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">Search Projects</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, number, location..."
                  value={searchTerm()}
                  onInput={(e) => handleSearchChange(e.currentTarget.value)}
                  class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">Status</label>
              <select
                value={statusFilter()}
                onChange={(e) => handleStatusChange(e.currentTarget.value)}
                class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="planning">Planning</option>
                <option value="bidding">Bidding</option>
                <option value="pre_construction">Pre-Construction</option>
                <option value="in_progress">In Progress</option>
                <option value="closeout">Closeout</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">Archived</label>
              <select
                value={archivedFilter()}
                onChange={(e) => handleArchivedChange(e.currentTarget.value)}
                class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
              >
                <option value="false">Active Only</option>
                <option value="true">Archived Only</option>
                <option value="all">All Projects</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">Min Budget</label>
              <input
                type="number"
                placeholder="Min $"
                value={minBudget()}
                onInput={(e) => setMinBudget(e.currentTarget.value)}
                onBlur={handleBudgetChange}
                class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                min="0"
                step="10000"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">Max Budget</label>
              <input
                type="number"
                placeholder="Max $"
                value={maxBudget()}
                onInput={(e) => setMaxBudget(e.currentTarget.value)}
                onBlur={handleBudgetChange}
                class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                min="0"
                step="10000"
              />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <Show
          when={!loading()}
          fallback={
            <div class="text-center py-16 bg-white rounded shadow-ca-sm border border-gray-200">
              <div class="flex justify-center mb-4">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-ca-orange"></div>
              </div>
              <h3 class="text-lg font-semibold text-text-primary">Loading projects...</h3>
            </div>
          }
        >
          <Show
            when={dbProjects().length > 0}
            fallback={
              <div class="text-center py-16 bg-white rounded shadow-ca-sm border border-gray-200">
                <div class="flex justify-center mb-4">
                  <div class="bg-gray-100 rounded-full p-4">
                    <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                </div>
                <h3 class="text-lg font-semibold text-text-primary">No projects found</h3>
                <p class="mt-2 text-text-secondary">
                  {searchTerm() || statusFilter() !== 'all' || archivedFilter() !== 'false' || minBudget() || maxBudget()
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating a new project.'}
                </p>
                <div class="mt-6">
                  <Show when={searchTerm() || statusFilter() !== 'all' || archivedFilter() !== 'false' || minBudget() || maxBudget()}>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setArchivedFilter('false');
                        setMinBudget('');
                        setMaxBudget('');
                        fetchProjects();
                      }}
                      class="inline-flex items-center bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded font-medium transition-all shadow-ca-sm hover:shadow-ca-md mr-3"
                    >
                      Clear Filters
                    </button>
                  </Show>
                  <a
                    href="/projects/new"
                    class="inline-flex items-center bg-ca-orange hover:bg-ca-orange-dark text-white px-5 py-2.5 rounded font-medium transition-all shadow-ca-sm hover:shadow-ca-md"
                  >
                    + New Project
                  </a>
                </div>
              </div>
            }
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <For each={dbProjects()}>
                {(project) => (
                  <ProjectHealthCard project={project} onArchiveToggle={() => fetchProjects()} />
                )}
              </For>
            </div>
          </Show>
        </Show>

        {/* Footer Count */}
        <Show when={!loading()}>
          <div class="mt-6 text-center">
            <p class="text-sm text-text-secondary">
              Showing <span class="font-medium text-text-primary">{dbProjects().length}</span> of <span class="font-medium text-text-primary">{totalCount()}</span> projects
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}

export function NewProjectForm() {
  const [formData, setFormData] = createSignal({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    budget: '',
    location: '',
    startDate: '',
    endDate: ''
  });

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [showSuccess, setShowSuccess] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = formData();

    // Create project payload for API
    // Note: createdBy and generalContractorId are set server-side from authenticated user
    const projectData = {
      name: data.name,
      description: data.description,
      status: data.status,
      projectNumber: `PROJ-${Date.now()}`, // Auto-generate project number
      totalBudget: parseFloat(data.budget) || 0,
      address: data.location,
      city: '', // Could parse from location
      state: '', // Could parse from location
      startDate: data.startDate,
      estimatedCompletion: data.endDate || null,
    };

    try {
      // Save to database via API
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const result = await response.json();
      console.log('Project created:', result);

      setShowSuccess(true);

      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        budget: '',
        location: '',
        startDate: '',
        endDate: ''
      });

      // Redirect to projects page after 2 seconds
      setTimeout(() => {
        window.location.href = '/projects';
      }, 2000);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div class="bg-gray-900 min-h-screen py-8">
      <div class="max-w-3xl mx-auto px-6">
        <div class="mb-8">
          <h1 class="text-3xl font-semibold text-white">Create New Project</h1>
          <p class="mt-2 text-gray-400">Add a new construction project to your portfolio</p>
        </div>

        <Show
          when={showSuccess()}
          fallback={
            <form onSubmit={handleSubmit} class="bg-gray-800 shadow-xl rounded-lg border border-gray-700 p-8 space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData().name}
                  onInput={(e) => updateField('name', e.currentTarget.value)}
                  class="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition-all"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData().description}
                  onInput={(e) => updateField('description', e.currentTarget.value)}
                  rows="4"
                  class="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition-all resize-none"
                  placeholder="Project description..."
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData().status}
                    onChange={(e) => updateField('status', e.currentTarget.value)}
                    class="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition-all"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Budget ($)</label>
                  <input
                    type="number"
                    value={formData().budget}
                    onInput={(e) => updateField('budget', e.currentTarget.value)}
                    class="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition-all"
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={formData().location}
                  onInput={(e) => updateField('location', e.currentTarget.value)}
                  class="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition-all"
                  placeholder="Project location"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData().startDate}
                    onInput={(e) => updateField('startDate', e.currentTarget.value)}
                    class="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData().endDate}
                    onInput={(e) => updateField('endDate', e.currentTarget.value)}
                    class="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition-all"
                  />
                </div>
              </div>

              <div class="flex justify-between items-center pt-6 border-t border-gray-700">
                <a
                  href="/projects"
                  class="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white px-6 py-2.5 rounded font-medium transition-all"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  disabled={isSubmitting()}
                  class="disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded font-medium transition-all shadow-lg hover:opacity-90"
                  style={{
                    'background-color': isSubmitting() ? '#4B5563' : '#FF6600'
                  }}
                >
                  {isSubmitting() ? 'Creating...' : 'Create Project'}
                </button>
              </div>
          </form>
        }
      >
          <div class="bg-gray-800 border border-[#3D9991] rounded-lg shadow-xl p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3D9991]/20 mb-4">
              <svg class="w-8 h-8 text-[#3D9991]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Project Created Successfully!</h3>
            <p class="text-gray-400">Redirecting to projects page...</p>
          </div>
        </Show>
      </div>
    </div>
  );
}