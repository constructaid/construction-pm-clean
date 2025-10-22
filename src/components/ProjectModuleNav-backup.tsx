/**
 * Horizontal Project Module Navigation
 * Displays project modules as buttons across the top
 */
import { createSignal } from 'solid-js';

interface ProjectModuleNavProps {
  projectId: string;
  currentPath?: string;
}

export default function ProjectModuleNav(props: ProjectModuleNavProps) {
  const modules = [
    {
      name: 'Dashboard',
      icon: '📊',
      color: '#06B6D4',
      href: `/projects/${props.projectId}`,
      description: 'Project Overview'
    },
    {
      name: 'RFI',
      icon: '📋',
      color: '#4BAAD8',
      href: `/projects/${props.projectId}/forms`,
      description: 'Requests for Information'
    },
    {
      name: 'Change Orders',
      icon: '📝',
      color: '#FF5E15',
      href: `/projects/${props.projectId}/forms`,
      description: 'Change Management'
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
      name: 'Pay Apps',
      icon: '💰',
      color: '#10B981',
      href: `/projects/${props.projectId}/payment-applications`,
      description: 'Payment Applications'
    },
    {
      name: 'Budget',
      icon: '💵',
      color: '#84CC16',
      href: `/projects/${props.projectId}/budget`,
      description: 'Budget Tracking'
    },
    {
      name: 'Documents',
      icon: '📁',
      color: '#64748B',
      href: `/projects/${props.projectId}/documents`,
      description: 'All Documents'
    },
    {
      name: 'Files',
      icon: '💾',
      color: '#10B981',
      href: `/projects/${props.projectId}/files`,
      description: 'File Manager'
    },
    {
      name: 'Safety',
      icon: '🦺',
      color: '#EF4444',
      href: `/projects/${props.projectId}/safety`,
      description: 'Safety Reports'
    },
    {
      name: 'Plans',
      icon: '📐',
      color: '#0EA5E9',
      href: `/projects/${props.projectId}/plans`,
      description: 'Plans & Specs'
    },
    {
      name: 'Meetings',
      icon: '📝',
      color: '#6366F1',
      href: `/projects/${props.projectId}/meetings`,
      description: 'Meeting Minutes'
    },
  ];

  const isActive = (href: string) => {
    if (typeof window === 'undefined') return false;
    const currentPath = window.location.pathname;
    // Exact match for dashboard
    if (href === `/projects/${props.projectId}`) {
      return currentPath === href;
    }
    // Path starts with for other modules
    return currentPath.startsWith(href);
  };

  return (
    <div class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto">
        <div class="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <nav class="flex space-x-1 px-4 py-3 min-w-max">
            {modules.map(module => {
              const active = isActive(module.href);
              return (
                <a
                  href={module.href}
                  class={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'shadow-md ring-2 ring-opacity-50'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={active ? `background-color: ${module.color}; color: white; ring-color: ${module.color};` : ''}
                  title={module.description}
                >
                  <span class="text-lg">{module.icon}</span>
                  <span>{module.name}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
