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
    case 'planning': return '#FF5E15'; // ConstructAid orange
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
  const [statusFilter, setStatusFilter] = createSignal<string>('');
  const [dbProjects, setDbProjects] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);

  // Fetch projects from database on mount - only on client side
  onMount(async () => {
    try {
      const response = await fetch('/api/projects?userId=1'); // Using mock GC user ID
      if (response.ok) {
        const data = await response.json();
        setDbProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  });

  const filteredProjects = () => {
    return dbProjects().filter(project => {
      const location = project.address || project.city || '';
      const matchesSearch = project.name.toLowerCase().includes(searchTerm().toLowerCase()) ||
                          location.toLowerCase().includes(searchTerm().toLowerCase());
      const matchesStatus = !statusFilter() || project.status === statusFilter();
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div class="bg-background-light min-h-screen">
      <div class="max-w-7xl mx-auto py-6 px-6">
        {/* Header */}
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-semibold text-text-primary">Projects</h1>
            <p class="mt-1 text-text-secondary">Manage and track all construction projects</p>
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">Search Projects</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchTerm()}
                  onInput={(e) => setSearchTerm(e.currentTarget.value)}
                  class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">Filter by Status</label>
              <select
                value={statusFilter()}
                onChange={(e) => setStatusFilter(e.currentTarget.value)}
                class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
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
            <div class="text-center py-16 bg-white rounded shadow-ca-sm border border-gray-200">
              <div class="flex justify-center mb-4">
                <div class="bg-gray-100 rounded-full p-4">
                  <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
              </div>
              <h3 class="text-lg font-semibold text-text-primary">No projects found</h3>
              <p class="mt-2 text-text-secondary">Get started by creating a new project.</p>
              <div class="mt-6">
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
            <For each={filteredProjects()}>
              {(project) => (
                <ProjectHealthCard project={project} />
              )}
            </For>
          </div>
        </Show>

        {/* Footer Count */}
        <div class="mt-6 text-center">
          <p class="text-sm text-text-secondary">
            Showing <span class="font-medium text-text-primary">{filteredProjects().length}</span> of <span class="font-medium text-text-primary">{dbProjects().length}</span> projects
          </p>
        </div>
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
      createdBy: 1, // Mock user ID (GC)
      generalContractorId: 1
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
    <div class="bg-background-light min-h-screen py-8">
      <div class="max-w-3xl mx-auto px-6">
        <div class="mb-8">
          <h1 class="text-3xl font-semibold text-text-primary">Create New Project</h1>
          <p class="mt-2 text-text-secondary">Add a new construction project to your portfolio</p>
        </div>

        <Show
          when={showSuccess()}
          fallback={
            <form onSubmit={handleSubmit} class="bg-white shadow-ca-md rounded border border-gray-200 p-8 space-y-6">
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData().name}
                  onInput={(e) => updateField('name', e.currentTarget.value)}
                  class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">Description</label>
                <textarea
                  value={formData().description}
                  onInput={(e) => updateField('description', e.currentTarget.value)}
                  rows="4"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                  placeholder="Project description..."
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-primary mb-2">Status</label>
                  <select
                    value={formData().status}
                    onChange={(e) => updateField('status', e.currentTarget.value)}
                    class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-primary mb-2">Budget ($)</label>
                  <input
                    type="number"
                    value={formData().budget}
                    onInput={(e) => updateField('budget', e.currentTarget.value)}
                    class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">Location</label>
                <input
                  type="text"
                  value={formData().location}
                  onInput={(e) => updateField('location', e.currentTarget.value)}
                  class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                  placeholder="Project location"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-primary mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData().startDate}
                    onInput={(e) => updateField('startDate', e.currentTarget.value)}
                    class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-primary mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData().endDate}
                    onInput={(e) => updateField('endDate', e.currentTarget.value)}
                    class="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ca-orange focus:border-ca-orange transition-all"
                  />
                </div>
              </div>

              <div class="flex justify-between items-center pt-6 border-t border-gray-200">
                <a
                  href="/projects"
                  class="bg-white hover:bg-gray-50 border border-gray-300 text-text-primary px-6 py-2.5 rounded font-medium transition-all"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  disabled={isSubmitting()}
                  class="bg-ca-orange hover:bg-ca-orange-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded font-medium transition-all shadow-ca-sm hover:shadow-ca-md"
                >
                  {isSubmitting() ? 'Creating...' : 'Create Project'}
                </button>
              </div>
          </form>
        }
      >
          <div class="bg-white border border-status-success rounded shadow-ca-md p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-success/10 mb-4">
              <svg class="w-8 h-8 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-text-primary mb-2">Project Created Successfully!</h3>
            <p class="text-text-secondary">Redirecting to projects page...</p>
          </div>
        </Show>
      </div>
    </div>
  );
}