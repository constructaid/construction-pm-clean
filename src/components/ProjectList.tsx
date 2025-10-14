import { createSignal, For } from 'solid-js';

// Sample project data
const [projects] = createSignal([
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
    startDate: '2023-08-01'
  }
]);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'planning': return 'bg-yellow-100 text-yellow-800';
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
  return (
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Construction Projects</h1>
        <p class="mt-2 text-gray-600">Manage and track all your construction projects</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <For each={projects()}>
          {(project) => (
            <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex items-start justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 truncate">
                  {project.name}
                </h3>
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              <p class="text-sm text-gray-500 mb-3">{project.location}</p>
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>

              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Budget:</span>
                  <span class="font-medium">{formatCurrency(project.budget)}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Start Date:</span>
                  <span class="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex space-x-2">
                  <button class="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-50">
                    View
                  </button>
                  <button class="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}