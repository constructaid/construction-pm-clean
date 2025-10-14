export function Hero() {
  return (
    <div class="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 overflow-hidden">
      {/* Background Pattern */}
      <div class="absolute inset-0 opacity-10">
        <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M0 32V0h32" fill="none" stroke="white" stroke-width="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div class="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 lg:py-32">
        <div class="text-center">
          {/* Main Heading */}
          <h1 class="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            <span class="block">Construction Project</span>
            <span class="block text-blue-200">Management System</span>
          </h1>

          {/* Subheading */}
          <p class="mt-6 max-w-2xl mx-auto text-xl text-blue-100 sm:text-2xl">
            Streamline your construction projects with our comprehensive management platform.
            Track progress, manage budgets, and coordinate teams all in one place.
          </p>

          {/* Feature Highlights */}
          <div class="mt-8 flex flex-wrap justify-center gap-4 text-blue-100 text-sm sm:text-base">
            <div class="flex items-center space-x-2">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Real-time Tracking</span>
            </div>
            <div class="flex items-center space-x-2">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Budget Management</span>
            </div>
            <div class="flex items-center space-x-2">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Team Collaboration</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/projects"
              class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
            >
              View All Projects
              <svg class="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </a>
            <a
              href="/projects/new"
              class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-blue-700 transition-colors"
            >
              Create New Project
            </a>
          </div>

          {/* Stats Section */}
          <div class="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
              <div class="text-3xl font-bold text-white">50+</div>
              <div class="text-blue-100 text-sm mt-1">Active Projects</div>
            </div>
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
              <div class="text-3xl font-bold text-white">$250M+</div>
              <div class="text-blue-100 text-sm mt-1">Total Budget Managed</div>
            </div>
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
              <div class="text-3xl font-bold text-white">98%</div>
              <div class="text-blue-100 text-sm mt-1">On-Time Delivery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </div>
  );
}
