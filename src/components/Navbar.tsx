import { createSignal, createEffect, onMount, Show } from 'solid-js';
import { LanguageToggle } from './LanguageToggle';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function Navbar() {
  const [isUserTypeOpen, setIsUserTypeOpen] = createSignal(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = createSignal(false);
  const [selectedUserType, setSelectedUserType] = createSignal('General Contractor');
  const [showHR, setShowHR] = createSignal(false);
  const [hrStatus, setHrStatus] = createSignal<'trial' | 'active' | null>(null);
  const [user, setUser] = createSignal<User | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  // Check authentication status on mount
  onMount(async () => {
    try {
      // Check if user is authenticated
      const authResponse = await fetch('/api/me');
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.user) {
          setUser(authData.user);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }

    // Check module access
    try {
      const response = await fetch('/api/company/modules?companyId=1');
      const data = await response.json();

      if (data.success) {
        const hrModule = data.data.modules.find((m: any) => m.moduleName === 'hr');
        if (hrModule && hrModule.isEnabled) {
          // Check if user is internal (for demo, assume General Contractor is internal)
          const isInternal = selectedUserType() !== 'Owner' &&
                           selectedUserType() !== 'Design Team' &&
                           selectedUserType() !== 'Client';

          setShowHR(isInternal);
          setHrStatus(hrModule.isTrialing ? 'trial' : 'active');
        }
      }
    } catch (error) {
      console.error('Error checking module access:', error);
    }
  });

  // Get user initials
  const getUserInitials = () => {
    const currentUser = user();
    if (currentUser) {
      const first = currentUser.firstName?.charAt(0) || '';
      const last = currentUser.lastName?.charAt(0) || '';
      return (first + last).toUpperCase() || currentUser.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if logout API fails
      window.location.href = '/login';
    }
  };

  // Close dropdowns when clicking outside
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest('.user-type-container')) {
        setIsUserTypeOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  const userTypes = [
    { name: 'Owner', icon: '🏢', path: '/dashboard/owner' },
    { name: 'Design Team', icon: '✏️', path: '/dashboard/design-team' },
    { name: 'General Contractor', icon: '👷', path: '/dashboard/general-contractor' },
    { name: 'Sub Contractor', icon: '🔧', path: '/dashboard/general-contractor' },
    { name: 'Client', icon: '👤', path: '/dashboard/client' },
  ];

  const handleUserTypeChange = (userType: { name: string; path: string }) => {
    setSelectedUserType(userType.name);
    setIsUserTypeOpen(false);

    // Update HR visibility based on user type
    const isInternal = userType.name !== 'Owner' &&
                     userType.name !== 'Design Team' &&
                     userType.name !== 'Client';
    setShowHR(isInternal && hrStatus() !== null);

    window.location.href = userType.path;
  };

  return (
    <nav class="bg-gray-900 shadow-lg border-b border-gray-800">
      <div class="w-full px-4">
        <div class="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div class="flex items-center space-x-8">
            <a href="/" class="group">
              <img
                src="/ConstructHub-logo.png"
                alt="ConstructHub"
                class="h-14 w-auto transition-transform group-hover:scale-105"
              />
            </a>

            {/* Primary Navigation */}
            <div class="hidden md:flex items-center space-x-1">
              <a
                href="/"
                class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-ca-orange hover:bg-gray-800 rounded transition-all"
              >
                Home
              </a>
              <a
                href="/projects"
                class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-ca-orange hover:bg-gray-800 rounded transition-all"
              >
                Projects
              </a>
              <a
                href="/portfolio"
                class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-ca-orange hover:bg-gray-800 rounded transition-all"
              >
                Portfolio
              </a>
              <a
                href="/ai-workspace"
                class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-ca-orange hover:bg-gray-800 rounded transition-all flex items-center gap-2"
              >
                <span>🤖</span>
                <span>AI Workspace</span>
              </a>
              <a
                href="/tasks"
                class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-ca-orange hover:bg-gray-800 rounded transition-all"
              >
                Tasks
              </a>
              <a
                href="/reports"
                class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-ca-orange hover:bg-gray-800 rounded transition-all"
              >
                Reports
              </a>
              <a
                href="/admin/users"
                class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-ca-orange hover:bg-gray-800 rounded transition-all flex items-center gap-2"
              >
                <span>⚙️</span>
                <span>Admin</span>
              </a>
              {showHR() && (
                <a
                  href="/hr"
                  class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-ca-orange hover:bg-gray-800 rounded transition-all flex items-center gap-2 relative"
                >
                  <span>👥</span>
                  <span>HR</span>
                  {hrStatus() === 'trial' && (
                    <span class="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg animate-pulse">
                      TRIAL
                    </span>
                  )}
                </a>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div class="flex items-center space-x-4">
            {/* User Type Dropdown */}
            <div class="relative user-type-container">
              <button
                onClick={() => setIsUserTypeOpen(!isUserTypeOpen())}
                class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded transition-all border border-gray-700"
              >
                <span>{selectedUserType()}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              {isUserTypeOpen() && (
                <div class="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                  <div class="py-1">
                    {userTypes.map((userType) => (
                      <button
                        onClick={() => handleUserTypeChange(userType)}
                        class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-3 transition-colors"
                      >
                        <span class="text-lg">{userType.icon}</span>
                        <span>{userType.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Search */}
            <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>

            {/* Notifications */}
            <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all relative">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <span class="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Language Toggle */}
            <LanguageToggle />

            {/* New Project Button */}
            <a
              href="/projects/new"
              class="bg-ca-orange hover:bg-ca-orange-dark text-white px-4 py-2 rounded text-sm font-medium transition-all shadow-lg hover:shadow-xl"
            >
              + New Project
            </a>

            {/* User Menu */}
            <div class="relative user-menu-container">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen())}
                class="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded transition-all"
              >
                <div class="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <Show when={!isLoading()} fallback={<span class="text-sm font-medium text-gray-400">...</span>}>
                    <span class="text-sm font-medium text-white">{getUserInitials()}</span>
                  </Show>
                </div>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              {isUserMenuOpen() && (
                <div class="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                  <Show when={user()} fallback={
                    <div class="py-2">
                      <a
                        href="/login"
                        class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-3 transition-colors"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                        <span>Sign In</span>
                      </a>
                      <a
                        href="/register"
                        class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-3 transition-colors"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                        <span>Create Account</span>
                      </a>
                    </div>
                  }>
                    <div class="py-2">
                      {/* User Info */}
                      <div class="px-4 py-3 border-b border-gray-700">
                        <p class="text-sm font-medium text-white">
                          {user()?.firstName} {user()?.lastName}
                        </p>
                        <p class="text-xs text-gray-400 truncate">{user()?.email}</p>
                        <p class="text-xs text-ca-orange mt-1 capitalize">{user()?.role?.replace('_', ' ')}</p>
                      </div>

                      {/* Menu Items */}
                      <a
                        href="/settings"
                        class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-3 transition-colors"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>Settings</span>
                      </a>

                      <button
                        onClick={handleLogout}
                        class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 flex items-center space-x-3 transition-colors"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </Show>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
