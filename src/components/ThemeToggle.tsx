/**
 * Theme Toggle Component
 * Allows users to switch between light and dark mode
 */
import { createSignal, onMount, Show } from 'solid-js';

export function ThemeToggle() {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('dark');
  const [mounted, setMounted] = createSignal(false);

  // Initialize theme from localStorage on mount
  onMount(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    // Apply theme to document
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setMounted(true);
  });

  const toggleTheme = () => {
    const newTheme = theme() === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Show when={mounted()}>
      <button
        onClick={toggleTheme}
        class="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
        aria-label="Toggle theme"
        title={`Switch to ${theme() === 'dark' ? 'light' : 'dark'} mode`}
      >
        {/* Sun Icon (Light Mode) */}
        <svg
          class={`w-5 h-5 transition-all duration-300 ${
            theme() === 'dark'
              ? 'rotate-0 scale-100 text-gray-400 group-hover:text-yellow-400'
              : 'rotate-90 scale-0 absolute text-gray-600'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* Moon Icon (Dark Mode) */}
        <svg
          class={`w-5 h-5 transition-all duration-300 ${
            theme() === 'dark'
              ? 'rotate-90 scale-0 absolute text-gray-400'
              : 'rotate-0 scale-100 text-gray-700 group-hover:text-blue-600'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>
    </Show>
  );
}
