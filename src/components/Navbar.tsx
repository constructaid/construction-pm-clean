export function Navbar() {
  return (
    <nav class="bg-white shadow-ca-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div class="flex items-center space-x-8">
            <a href="/" class="flex items-center space-x-2 group">
              <div class="bg-ca-orange p-1.5 rounded">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <span class="text-xl font-semibold text-text-primary tracking-tight">ConstructAid</span>
            </a>

            {/* Primary Navigation */}
            <div class="hidden md:flex items-center space-x-1">
              <a
                href="/"
                class="px-3 py-2 text-sm font-medium text-text-primary hover:text-ca-orange hover:bg-gray-50 rounded transition-all"
              >
                Home
              </a>
              <a
                href="/projects"
                class="px-3 py-2 text-sm font-medium text-text-primary hover:text-ca-orange hover:bg-gray-50 rounded transition-all"
              >
                Projects
              </a>
              <a
                href="/tasks"
                class="px-3 py-2 text-sm font-medium text-text-primary hover:text-ca-orange hover:bg-gray-50 rounded transition-all"
              >
                Tasks
              </a>
              <a
                href="/reports"
                class="px-3 py-2 text-sm font-medium text-text-primary hover:text-ca-orange hover:bg-gray-50 rounded transition-all"
              >
                Reports
              </a>
            </div>
          </div>

          {/* Right Side Actions */}
          <div class="flex items-center space-x-4">
            {/* Search */}
            <button class="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded transition-all">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>

            {/* Notifications */}
            <button class="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded transition-all relative">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <span class="absolute top-1 right-1 h-2 w-2 bg-status-error rounded-full"></span>
            </button>

            {/* New Project Button */}
            <a
              href="/projects/new"
              class="bg-ca-orange hover:bg-ca-orange-dark text-white px-4 py-2 rounded text-sm font-medium transition-all shadow-ca-sm hover:shadow-ca-md"
            >
              + New Project
            </a>

            {/* User Menu */}
            <button class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded transition-all">
              <div class="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-text-primary">JD</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}