import { createSignal } from 'solid-js';

export function Navbar() {
  const [isUserTypeOpen, setIsUserTypeOpen] = createSignal(false);
  const [selectedUserType, setSelectedUserType] = createSignal('General Contractor');

  const userTypes = [
    { name: 'Owner', icon: '🏢', path: '/dashboard/owner' },
    { name: 'Design Team', icon: '✏️', path: '/dashboard/design-team' },
    { name: 'General Contractor', icon: '👷', path: '/dashboard/general-contractor' },
    { name: 'Sub Contractor', icon: '🔧', path: '/dashboard/sub-contractor' },
    { name: 'Guest User', icon: '👤', path: '/dashboard/guest' },
  ];

  const handleUserTypeChange = (userType: { name: string; path: string }) => {
    setSelectedUserType(userType.name);
    setIsUserTypeOpen(false);
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
                src="/constructaid-logo.png"
                alt="ConstructAid LLC"
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
            </div>
          </div>

          {/* Right Side Actions */}
          <div class="flex items-center space-x-4">
            {/* User Type Dropdown */}
            <div class="relative">
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

            {/* New Project Button */}
            <a
              href="/projects/new"
              class="bg-ca-orange hover:bg-ca-orange-dark text-white px-4 py-2 rounded text-sm font-medium transition-all shadow-lg hover:shadow-xl"
            >
              + New Project
            </a>

            {/* User Menu */}
            <button class="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded transition-all">
              <div class="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-white">JD</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}