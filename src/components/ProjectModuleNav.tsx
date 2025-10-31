/**
 * Improved Project Module Navigation with Collapsible Groups
 * Organizes modules into logical categories for better UX
 */
import { createSignal, For, Show, onMount } from 'solid-js';

interface ProjectModuleNavProps {
  projectId: string;
  currentPath?: string;
}

interface Module {
  name: string;
  icon: string;
  color: string;
  href: string;
  description: string;
}

interface Category {
  name: string;
  icon: string;
  modules: Module[];
  defaultExpanded?: boolean;
}

export default function ProjectModuleNav(props: ProjectModuleNavProps) {
  // Categories with grouped modules
  const categories: Category[] = [
    {
      name: 'Project Management',
      icon: '📊',
      defaultExpanded: true,
      modules: [
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
          color: '#10B981',
          href: `/projects/${props.projectId}/tasks`,
          description: 'Tasks & Action Log'
        },
        {
          name: 'Schedule',
          icon: '📅',
          color: '#3D9991',
          href: `/projects/${props.projectId}/schedule`,
          description: 'Project Timeline'
        },
        {
          name: 'Meetings',
          icon: '📝',
          color: '#2D3748',
          href: `/projects/${props.projectId}/meetings`,
          description: 'Meeting Minutes'
        },
      ]
    },
    {
      name: 'Procurement',
      icon: '💼',
      defaultExpanded: true,
      modules: [
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
          name: 'Change Orders',
          icon: '📝',
          color: '#FF6600',
          href: `/projects/${props.projectId}/change-orders`,
          description: 'Change Management'
        },
        {
          name: 'Bid Packages',
          icon: '📦',
          color: '#8B5CF6',
          href: `/projects/${props.projectId}/bid-packages`,
          description: 'Manage Bid Packages'
        },
      ]
    },
    {
      name: 'Financial',
      icon: '💰',
      defaultExpanded: false,
      modules: [
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
      ]
    },
    {
      name: 'Documents & Files',
      icon: '📁',
      defaultExpanded: false,
      modules: [
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
          name: 'Plans',
          icon: '📐',
          color: '#4BAAD8',
          href: `/projects/${props.projectId}/plans`,
          description: 'Plans & Specs'
        },
      ]
    },
    {
      name: 'People & Contracts',
      icon: '👥',
      defaultExpanded: false,
      modules: [
        {
          name: 'Contacts',
          icon: '👥',
          color: '#6366F1',
          href: `/projects/${props.projectId}/contacts`,
          description: 'Contact Management'
        },
        {
          name: 'Contracts',
          icon: '📜',
          color: '#10B981',
          href: `/projects/${props.projectId}/contracts`,
          description: 'Subcontract Agreements'
        },
      ]
    },
    {
      name: 'Field Operations',
      icon: '🔧',
      defaultExpanded: false,
      modules: [
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
      ]
    },
  ];

  // State for collapsed categories
  const [collapsed, setCollapsed] = createSignal<Record<string, boolean>>({});

  // Load saved preferences from localStorage
  onMount(() => {
    const saved = localStorage.getItem('projectNavCollapsed');
    if (saved) {
      setCollapsed(JSON.parse(saved));
    } else {
      // Initialize with defaults
      const initial: Record<string, boolean> = {};
      categories.forEach(cat => {
        initial[cat.name] = !cat.defaultExpanded;
      });
      setCollapsed(initial);
    }
  });

  // Toggle category
  const toggleCategory = (categoryName: string) => {
    const newCollapsed = {
      ...collapsed(),
      [categoryName]: !collapsed()[categoryName]
    };
    setCollapsed(newCollapsed);
    localStorage.setItem('projectNavCollapsed', JSON.stringify(newCollapsed));
  };

  // Check if a module is active
  const isActive = (href: string) => {
    if (typeof window === 'undefined') return false;
    const currentPath = window.location.pathname;
    if (href === `/projects/${props.projectId}`) {
      return currentPath === href;
    }
    return currentPath.startsWith(href);
  };

  return (
    <aside class="w-64 bg-gray-900 border-r border-gray-800 shadow-lg fixed left-0 top-16 bottom-0 overflow-y-auto z-30">
      <nav class="flex flex-col p-4 space-y-1">
        {/* Quick Actions */}
        <div class="mb-2 space-y-2">
          <a
            href={`mailto:?subject=Project ${props.projectId}`}
            class="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-all text-sm border border-gray-700"
            title="Send Email"
          >
            <span class="text-lg">✉️</span>
            <span>Email</span>
          </a>

          <a
            href="https://teams.microsoft.com/l/entity/ef56c0de-36fc-4ef8-b417-3d82e9894fd0/_djb2_msteams_prefix_1925646355"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-all text-sm border border-gray-700"
            title="Open Teams Calendar"
          >
            <span class="text-lg">📆</span>
            <span>Calendar</span>
          </a>
        </div>

        {/* Divider */}
        <div class="border-t border-gray-700 my-2"></div>

        {/* Categorized Modules */}
        <For each={categories}>
          {(category) => (
            <div class="mb-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.name)}
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800 transition-all group"
              >
                <div class="flex items-center gap-2">
                  <span class="text-base">{category.icon}</span>
                  <span class="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                    {category.name}
                  </span>
                </div>
                <svg
                  class={`w-4 h-4 text-gray-500 transition-transform ${
                    collapsed()[category.name] ? '' : 'rotate-90'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Category Modules */}
              <Show when={!collapsed()[category.name]}>
                <div class="mt-1 ml-2 space-y-1">
                  <For each={category.modules}>
                    {(module) => {
                      const active = isActive(module.href);
                      return (
                        <a
                          href={module.href}
                          class={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            active
                              ? 'shadow-md text-white font-medium'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 border border-gray-700/50'
                          }`}
                          style={active ? `background-color: ${module.color};` : ''}
                          title={module.description}
                        >
                          <span class="text-base">{module.icon}</span>
                          <span class="text-xs">{module.name}</span>
                        </a>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </For>

        {/* Collapse All / Expand All */}
        <div class="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => {
              const allCollapsed = Object.values(collapsed()).every(v => v);
              const newState: Record<string, boolean> = {};
              categories.forEach(cat => {
                newState[cat.name] = !allCollapsed;
              });
              setCollapsed(newState);
              localStorage.setItem('projectNavCollapsed', JSON.stringify(newState));
            }}
            class="w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-300 text-center transition-colors"
          >
            {Object.values(collapsed()).every(v => v) ? 'Expand All' : 'Collapse All'}
          </button>
        </div>
      </nav>
    </aside>
  );
}
