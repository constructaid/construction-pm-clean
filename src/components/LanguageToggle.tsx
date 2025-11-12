import { createSignal, onMount, onCleanup } from 'solid-js';
import i18next, { setLanguage, getLanguage, type Language } from '../i18n/config';

export function LanguageToggle() {
  // Initialize i18next on component mount
  const [currentLang, setCurrentLang] = createSignal<Language>('en');

  // Listen for language changes
  const handleLanguageChange = (event: CustomEvent<Language>) => {
    setCurrentLang(event.detail);
  };

  onMount(() => {
    // Wait for i18next to be ready, then set initial language
    if (i18next.isInitialized) {
      setCurrentLang(getLanguage());
    } else {
      i18next.on('initialized', () => {
        setCurrentLang(getLanguage());
      });
    }

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
  });

  onCleanup(() => {
    window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
  });

  const toggleLanguage = () => {
    const newLang: Language = currentLang() === 'en' ? 'es' : 'en';
    setLanguage(newLang);
    setCurrentLang(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-all"
      title={currentLang() === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
    >
      <span class="text-lg">{currentLang() === 'en' ? '🇺🇸' : '🇪🇸'}</span>
      <span class="text-sm font-semibold text-gray-300">
        {currentLang() === 'en' ? 'EN' : 'ES'}
      </span>
      <svg
        class="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    </button>
  );
}
