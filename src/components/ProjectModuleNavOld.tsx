/**
 * Left Sidebar Project Module Navigation
 * Displays project modules as vertical buttons in a left sidebar
 */
import { createSignal } from 'solid-js';

interface ProjectModuleNavProps {
  projectId: string;
  currentPath?: string;
}

export default function ProjectModuleNav(props: ProjectModuleNavProps) {
  const modules = [
    {
      name: 'Project Info',
      icon: 'ℹ️',
      color: '#4BAAD8',
      href: `/projects/${props.projectId}`,
      description: 'View and Edit Project Information'
    },
    {
      name: 'Team',
      icon: '👤',
      color: '#8B5CF6',
      href: `/projects/${props.projectId}/team`,
      description: 'Project Team Members'
    },
    {
      name: 'Tasks',
      icon: '✅',
      color: '#8B5CF6',
      href: `/projects/${props.projectId}/tasks`,
      description: 'Tasks & Action Log'
    },
    {
      name: 'RFI',
      icon: '📋',
      color: '#4A5568',
      href: `/projects/${props.projectId}/rfis`,
      description: 'Requests for Information'
    },
    {
      name: 'Submittals',
      icon: '📦',
      color: '#2D3748',
      href: `/projects/${props.projectId}/submittals`,
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
      name: 'Change Orders',
      icon: '📝',
      color: '#FF6600',
      href: `/projects/${props.projectId}/change-orders`,
      description: 'Change Management'
    },
    {
      name: 'Pay Apps',
      icon: '💰',
      color: '#1A365D',
      href: `/projects/${props.projectId}/payment-applications`,
      description: 'Payment Applications'
    },
    {
      name: 'XRP Payments',
      icon: '⚡',
      color: '#3B82F6',
      href: `/projects/${props.projectId}/xrp-payments`,
      description: 'Blockchain Payments'
    },
    {
      name: 'Contracts',
      icon: '📜',
      color: '#10B981',
      href: `/projects/${props.projectId}/contracts`,
      description: 'Subcontract Agreements'
    },
    {
      name: 'Contacts',
      icon: '👥',
      color: '#6366F1',
      href: `/projects/${props.projectId}/contacts`,
      description: 'Contact Management'
    },
    {
      name: 'Budget',
      icon: '💵',
      color: '#4A5568',
      href: `/projects/${props.projectId}/budget`,
      description: 'Budget Tracking'
    },
    {
      name: 'Estimating',
      icon: '📊',
      color: '#10B981',
      href: `/projects/${props.projectId}/estimating`,
      description: 'Cost Estimates & Bidding'
    },
    {
      name: 'Bid Packages',
      icon: '📦',
      color: '#8B5CF6',
      href: `/projects/${props.projectId}/bid-packages`,
      description: 'Manage Bid Packages'
    },
    {
      name: 'Documents',
      icon: '📁',
      color: '#2D3748',
      href: `/projects/${props.projectId}/documents`,
      description: 'All Documents'
    },
    {
      name: 'Files',
      icon: '💾',
      color: '#1A202C',
      href: `/projects/${props.projectId}/files`,
      description: 'File Manager'
    },
    {
      name: 'Field Supt',
      icon: '👷',
      color: '#0EA5E9',
      href: `/projects/${props.projectId}/field`,
      description: 'Field Superintendent Dashboard'
    },
    {
      name: 'Safety',
      icon: '🦺',
      color: '#FF5E15',
      href: `/projects/${props.projectId}/safety`,
      description: 'Safety Reports'
    },
    {
      name: 'Plans',
      icon: '📐',
      color: '#4BAAD8',
      href: `/projects/${props.projectId}/plans`,
      description: 'Plans & Specs'
    },
    {
      name: 'Meetings',
      icon: '📝',
      color: '#2D3748',
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
    <aside class="w-64 bg-gray-900 border-r border-gray-800 shadow-lg fixed left-0 top-16 bottom-0 overflow-y-auto z-30">
      <nav class="flex flex-col p-4 space-y-2">
        {/* Email Button */}
        <a
          href={`mailto:?subject=Project ${props.projectId}`}
          class="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-all font-medium shadow-sm border border-gray-600"
          title="Send Email"
        >
          <span class="text-xl">✉️</span>
          <span>Email</span>
        </a>

        {/* Teams Calendar Button */}
        <a
          href="https://teams.microsoft.com/l/entity/ef56c0de-36fc-4ef8-b417-3d82e9894fd0/_djb2_msteams_prefix_1925646355"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-all font-medium shadow-sm border border-gray-600"
          title="Open Teams Calendar"
        >
          <span class="text-xl">📆</span>
          <span>Teams Calendar</span>
        </a>

        {/* Divider */}
        <div class="border-t border-gray-700 my-2"></div>

        {/* Module Buttons */}
        {modules.map(module => {
          const active = isActive(module.href);
          return (
            <a
              href={module.href}
              class={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'shadow-md text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
              style={active ? `background-color: ${module.color};` : ''}
              title={module.description}
            >
              <span class="text-xl">{module.icon}</span>
              <span>{module.name}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
