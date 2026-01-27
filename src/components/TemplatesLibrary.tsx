/**
 * Templates Library Component
 * Browse and select project templates
 */
import { createSignal, createEffect, For, Show } from 'solid-js';

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  useCount: number;
  tags: string[];
  milestones: any[];
  teamRoles: any[];
  createdBy: number;
}

export default function TemplatesLibrary() {
  const [templates, setTemplates] = createSignal<Template[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [categoryFilter, setCategoryFilter] = createSignal<string>('all');
  const [selectedTemplate, setSelectedTemplate] = createSignal<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = createSignal(false);

  createEffect(() => {
    fetchTemplates();
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: categoryFilter(),
      });

      const response = await fetch(`/api/templates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'commercial': return '🏢';
      case 'residential': return '🏠';
      case 'industrial': return '🏭';
      case 'infrastructure': return '🌉';
      case 'renovation': return '🔨';
      default: return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'commercial': return 'bg-blue-100 text-blue-800';
      case 'residential': return 'bg-green-100 text-green-800';
      case 'industrial': return 'bg-purple-100 text-purple-800';
      case 'infrastructure': return 'bg-orange-100 text-orange-800';
      case 'renovation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div class="bg-gray-900 min-h-screen">
      <div class="max-w-7xl mx-auto py-6 px-6">
        {/* Header */}
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-semibold text-white">Project Templates</h1>
            <p class="mt-1 text-gray-400">Start your project with a pre-configured template</p>
          </div>
          <a
            href="/projects/new"
            class="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded font-medium transition-all"
          >
            ← Back to Projects
          </a>
        </div>

        {/* Category Filter */}
        <div class="bg-white rounded shadow-sm p-4 mb-6 border border-gray-200">
          <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
          <select
            value={categoryFilter()}
            onChange={(e) => {
              setCategoryFilter(e.currentTarget.value);
              fetchTemplates();
            }}
            class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Categories</option>
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="industrial">Industrial</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="renovation">Renovation</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Templates Grid */}
        <Show
          when={!loading()}
          fallback={
            <div class="text-center py-16">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-orange-600"></div>
              <p class="mt-4 text-gray-400">Loading templates...</p>
            </div>
          }
        >
          <Show
            when={templates().length > 0}
            fallback={
              <div class="text-center py-16 bg-white rounded shadow-sm border border-gray-200">
                <div class="bg-gray-100 rounded-full p-4 inline-block mb-4">
                  <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">No templates found</h3>
                <p class="mt-2 text-gray-600">Try adjusting your filter or create a custom project</p>
              </div>
            }
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <For each={templates()}>
                {(template) => (
                  <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
                    {/* Template Header */}
                    <div class="p-6 border-b border-gray-200">
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">{getCategoryIcon(template.category)}</span>
                            <span class={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                          </div>
                          <h3 class="text-xl font-bold text-gray-900">{template.name}</h3>
                        </div>
                        <Show when={template.isPublic}>
                          <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Public
                          </span>
                        </Show>
                      </div>
                      <p class="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                    </div>

                    {/* Template Details */}
                    <div class="p-6">
                      <div class="space-y-3 mb-4">
                        <div class="flex items-center text-sm text-gray-700">
                          <svg class="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>{template.milestones?.length || 0} milestones</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-700">
                          <svg class="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{template.teamRoles?.length || 0} team roles</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-700">
                          <svg class="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          <span>Used {template.useCount} times</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <Show when={template.tags && template.tags.length > 0}>
                        <div class="flex flex-wrap gap-1 mb-4">
                          <For each={template.tags.slice(0, 3)}>
                            {(tag) => (
                              <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            )}
                          </For>
                        </div>
                      </Show>

                      {/* Actions */}
                      <div class="space-y-2">
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          class="w-full text-center bg-orange-600 hover:bg-orange-700 text-white py-2.5 px-4 rounded font-medium transition-all"
                        >
                          Use This Template
                        </button>
                        <button
                          onClick={() => {
                            // View details - could open a modal or navigate to details page
                            alert(`Template: ${template.name}\n\nMilestones: ${template.milestones?.length || 0}\nTeam Roles: ${template.teamRoles?.length || 0}\n\n${template.description}`);
                          }}
                          class="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm font-medium transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>

        {/* Create Project Modal */}
        <Show when={selectedTemplate()}>
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 class="text-2xl font-bold mb-4">Create Project from Template</h2>
              <p class="text-gray-600 mb-6">Template: {selectedTemplate()?.name}</p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const projectData = {
                    name: formData.get('name') as string,
                    projectNumber: formData.get('projectNumber') as string,
                    description: formData.get('description') as string,
                    address: formData.get('address') as string,
                    city: formData.get('city') as string,
                    state: formData.get('state') as string,
                    zipCode: formData.get('zipCode') as string,
                    totalBudget: parseFloat(formData.get('totalBudget') as string) || 0,
                    startDate: formData.get('startDate') as string,
                    estimatedCompletion: formData.get('estimatedCompletion') as string,
                  };

                  try {
                    const response = await fetch(`/api/templates/${selectedTemplate()?.id}/use`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(projectData),
                    });

                    if (response.ok) {
                      const result = await response.json();
                      window.location.href = `/projects/${result.projectId}`;
                    } else {
                      const error = await response.json();
                      alert(`Failed to create project: ${error.error || 'Unknown error'}`);
                    }
                  } catch (error) {
                    console.error('Error creating project:', error);
                    alert('Error creating project');
                  }
                }}
                class="space-y-4"
              >
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Project Number *</label>
                  <input
                    type="text"
                    name="projectNumber"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., PROJ-2024-001"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Project description"
                  ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      maxlength="2"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                    <input
                      type="number"
                      name="totalBudget"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estimated Completion</label>
                    <input
                      type="date"
                      name="estimatedCompletion"
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div class="flex gap-3 pt-4">
                  <button
                    type="submit"
                    class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 px-4 rounded font-medium transition-all"
                  >
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    class="px-6 py-2.5 bg-gray-300 text-gray-700 rounded font-medium hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
