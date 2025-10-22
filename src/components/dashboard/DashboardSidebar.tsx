/**
 * Dashboard Sidebar Component
 * Navigation menu for dashboard with role-based menu items
 */
import { createSignal } from 'solid-js';

interface DashboardSidebarProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    company: string;
  };
}

export default function DashboardSidebar(props: DashboardSidebarProps) {
  const [activeMenu, setActiveMenu] = createSignal('dashboard');

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard/general-contractor',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/tasks',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/notifications',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      badge: 5
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'team',
      label: 'Team',
      href: '/team',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div class="h-full flex flex-col">
      {/* Logo/Brand */}
      <div class="p-6 border-b border-white border-opacity-10">
        <h1 class="text-2xl font-bold text-white">ConstructAid</h1>
        <p class="text-xs text-gray-400 mt-1">Project Management</p>
      </div>

      {/* User Info */}
      <div class="p-4 border-b border-white border-opacity-10">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-primary-orange rounded-full flex items-center justify-center text-white font-bold">
            {props.currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{props.currentUser.name}</p>
            <p class="text-xs text-gray-400 truncate">{props.currentUser.company}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav class="flex-1 overflow-y-auto py-4">
        <ul class="space-y-1 px-3">
          {menuItems.map((item) => (
            <li>
              <a
                href={item.href}
                class={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  activeMenu() === item.id
                    ? 'bg-primary-orange text-white'
                    : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={() => setActiveMenu(item.id)}
              >
                <div class="flex items-center space-x-3">
                  {item.icon}
                  <span class="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span class="bg-primary-orange text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div class="p-4 border-t border-white border-opacity-10">
        <a
          href="/logout"
          class="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="text-sm font-medium">Logout</span>
        </a>
      </div>
    </div>
  );
}
