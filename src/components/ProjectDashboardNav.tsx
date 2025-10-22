/**
 * Project Dashboard Navigation Component
 * Comprehensive navigation for all project modules
 */
import { createSignal } from 'solid-js';

interface ProjectDashboardNavProps {
  projectId: string;
}

export default function ProjectDashboardNav(props: ProjectDashboardNavProps) {
  const modules = [
    {
      name: 'RFI',
      icon: '📋',
      color: '#4BAAD8',
      href: `/projects/${props.projectId}/forms`,
      description: 'Requests for Information'
    },
    {
      name: 'Change Management',
      icon: '📝',
      color: '#FF5E15',
      href: `/projects/${props.projectId}/forms`,
      description: 'Change Orders & Tracking'
    },
    {
      name: 'Submittals',
      icon: '📦',
      color: '#7C3AED',
      href: `/projects/${props.projectId}/forms`,
      description: 'Product Submittals'
    },
    {
      name: 'Schedule',
      icon: '📅',
      color: '#3D9991',
      href: `/projects/${props.projectId}/schedule`,
      description: 'Project Timeline'
    },
    {
      name: 'Safety',
      icon: '🦺',
      color: '#EF4444',
      href: `/projects/${props.projectId}/safety`,
      description: 'Safety Reports & Compliance'
    },
    {
      name: 'Pay Applications',
      icon: '💰',
      color: '#10B981',
      href: `/projects/${props.projectId}/pay-apps`,
      description: 'AIA G702/G703 Payment Apps'
    },
    {
      name: 'Subcontractors',
      icon: '👷',
      color: '#F59E0B',
      href: `/projects/${props.projectId}/subs`,
      description: 'Subcontractor & Supplier Management'
    },
    {
      name: 'Owner/Client',
      icon: '👤',
      color: '#8B5CF6',
      href: `/projects/${props.projectId}/owner`,
      description: 'Owner Information & Communication'
    },
    {
      name: 'Job Information',
      icon: '📊',
      color: '#06B6D4',
      href: `/projects/${props.projectId}`,
      description: 'Project Details & Overview'
    },
    {
      name: 'Budget',
      icon: '💵',
      color: '#84CC16',
      href: `/projects/${props.projectId}/budget`,
      description: 'Budget Tracking & Analysis'
    },
    {
      name: 'Proposals',
      icon: '📄',
      color: '#EC4899',
      href: `/projects/${props.projectId}/proposals`,
      description: 'Proposals & Estimates'
    },
    {
      name: 'Estimating',
      icon: '🔢',
      color: '#14B8A6',
      href: `/projects/${props.projectId}/estimating`,
      description: 'Cost Estimating & Takeoffs'
    },
    {
      name: 'Meeting Minutes',
      icon: '📝',
      color: '#6366F1',
      href: `/projects/${props.projectId}/meetings`,
      description: 'Meeting Notes & Action Items'
    },
    {
      name: 'Plans & Specs',
      icon: '📐',
      color: '#0EA5E9',
      href: `/projects/${props.projectId}/plans`,
      description: 'Drawings & Specifications'
    },
    {
      name: 'Documents',
      icon: '📁',
      color: '#64748B',
      href: `/projects/${props.projectId}/documents`,
      description: 'All Project Documents'
    },
    {
      name: 'File Manager',
      icon: '💾',
      color: '#10B981',
      href: `/projects/${props.projectId}/files`,
      description: 'Upload & Manage Files'
    }
  ];

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Project Modules</h2>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {modules.map(module => (
          <a
            href={module.href}
            class="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-current transition-all hover:shadow-lg group"
            style={`--hover-color: ${module.color};`}
          >
            <div
              class="text-4xl mb-2 w-16 h-16 flex items-center justify-center rounded-full transition-all group-hover:scale-110"
              style={`background-color: ${module.color}20;`}
            >
              {module.icon}
            </div>
            <h3
              class="text-sm font-semibold text-center mb-1 transition-colors"
              style={`color: ${module.color};`}
            >
              {module.name}
            </h3>
            <p class="text-xs text-gray-500 text-center line-clamp-2">
              {module.description}
            </p>
          </a>
        ))}
      </div>

      <style>
        {`
          a:hover {
            border-color: var(--hover-color);
          }
        `}
      </style>
    </div>
  );
}
