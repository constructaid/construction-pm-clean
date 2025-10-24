export function Hero() {
  return (
    <div class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Subtle Grid Pattern */}
      <div class="absolute inset-0 opacity-5">
        <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40V0h40" fill="none" stroke="white" stroke-width="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Orange Accent Gradient */}
      <div class="absolute top-0 right-0 w-1/2 h-full opacity-10">
        <div class="absolute top-0 right-0 w-96 h-96 bg-ca-orange blur-3xl rounded-full"></div>
      </div>

      <div class="relative max-w-7xl mx-auto py-16 px-6 sm:py-24 lg:py-28">
        <div class="text-center">
          {/* Main Heading */}
          <h1 class="text-4xl font-heading font-light text-white sm:text-5xl lg:text-6xl tracking-tight">
            <span class="block">Modern Construction</span>
            <span class="block mt-2 text-ca-orange">Project Management</span>
          </h1>

          {/* Tagline */}
          <p class="mt-4 text-2xl text-ca-orange font-heading font-light tracking-wide uppercase">
            Concept to Completion
          </p>

          {/* Subheading */}
          <p class="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-300 leading-relaxed">
            Streamline your construction projects with powerful tools for tracking,
            budgeting, and team collaboration—all in one unified platform.
          </p>

          {/* CTA Buttons */}
          <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/projects"
              class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded bg-ca-orange hover:bg-ca-orange-dark text-white shadow-ca-md hover:shadow-ca-lg transition-all"
            >
              View Projects
              <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
            <a
              href="/projects/new"
              class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded border-2 border-white/30 text-white hover:bg-white/10 transition-all"
            >
              + New Project
            </a>
          </div>

          {/* Stats Section - Procore Style */}
          <div class="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-procore hover:bg-white/15 transition-all">
              <div class="text-4xl font-bold text-white">50+</div>
              <div class="text-sm mt-2 text-gray-300 font-medium">Active Projects</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-procore hover:bg-white/15 transition-all">
              <div class="text-4xl font-bold text-white">$250M+</div>
              <div class="text-sm mt-2 text-gray-300 font-medium">Budget Managed</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-procore hover:bg-white/15 transition-all">
              <div class="text-4xl font-bold text-white">98%</div>
              <div class="text-sm mt-2 text-gray-300 font-medium">On-Time Delivery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
