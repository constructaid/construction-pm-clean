import { createSignal, For, Show } from 'solid-js';

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
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'planning': return 'bg-yellow-100 text-yellow-800';
    case 'on_hold': return 'bg-orange-100 text-orange-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
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
  const [statusFilter, setStatusFilter] = createSignal<string>('');

  const filteredProjects = () => {
    return projects().filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm().toLowerCase()) ||
                          project.location.toLowerCase().includes(searchTerm().toLowerCase());
      const matchesStatus = !statusFilter() || project.status === statusFilter();
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Construction Projects</h1>
          <p class="mt-2 text-gray-600">Manage and track all your construction projects</p>
        </div>
        <a
          href="/projects/new"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add New Project
        </a>
      </div>

      {/* Filters */}
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search Projects</label>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter()}
              onChange={(e) => setStatusFilter(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <Show
        when={filteredProjects().length > 0}
        fallback={
          <div class="text-center py-12 bg-white rounded-lg shadow">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900">No projects found</h3>
            <p class="mt-2 text-gray-500">Get started by creating a new project.</p>
            <div class="mt-6">
              <a
                href="/projects/new"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add New Project
              </a>
            </div>
          </div>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={filteredProjects()}>
            {(project) => (
              <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-900 truncate pr-2">
                    {project.name}
                  </h3>
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                <p class="text-sm text-gray-500 mb-3">{project.location}</p>
                <p class="text-sm text-gray-600 mb-4 line-clamp-3">{project.description}</p>

                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Budget:</span>
                    <span class="font-medium">{formatCurrency(project.budget)}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Start Date:</span>
                    <span class="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  <Show when={project.endDate}>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">End Date:</span>
                      <span class="font-medium">{new Date(project.endDate!).toLocaleDateString()}</span>
                    </div>
                  </Show>
                </div>

                <div class="mt-4 pt-4 border-t border-gray-200">
                  <div class="flex space-x-2">
                    <button class="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-50">
                      View Details
                    </button>
                    <button class="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700">
                      Edit Project
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="mt-8 text-center">
        <p class="text-gray-500">
          Showing {filteredProjects().length} of {projects().length} projects
        </p>
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

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = formData();
    const project = {
      name: data.name,
      description: data.description,
      status: data.status,
      budget: parseFloat(data.budget) || 0,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate || undefined
    };

    addProject(project);

    setShowSuccess(true);
    setIsSubmitting(false);

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
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div class="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p class="mt-2 text-gray-600">Add a new construction project to your portfolio</p>
      </div>

      <Show
        when={showSuccess()}
        fallback={
          <form onSubmit={handleSubmit} class="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
              <input
                type="text"
                required
                value={formData().name}
                onInput={(e) => updateField('name', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData().description}
                onInput={(e) => updateField('description', e.currentTarget.value)}
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project description..."
              ></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData().status}
                  onChange={(e) => updateField('status', e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                <input
                  type="number"
                  value={formData().budget}
                  onInput={(e) => updateField('budget', e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData().location}
                onInput={(e) => updateField('location', e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project location"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData().startDate}
                  onInput={(e) => updateField('startDate', e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData().endDate}
                  onInput={(e) => updateField('endDate', e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="flex justify-between pt-6">
              <a
                href="/projects"
                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={isSubmitting()}
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isSubmitting() ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        }
      >
        <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-green-800 mb-2">Project Created Successfully!</h3>
          <p class="text-green-600">Redirecting to projects page...</p>
        </div>
      </Show>
    </div>
  );
}