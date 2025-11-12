import { createSignal, onMount, onCleanup } from 'solid-js';
import i18next, { getLanguage, type Language } from './config';

/**
 * Solid.js hook for translations
 * Usage: const t = useTranslation();
 * Then: t('common.save') or t('field.dailyReports')
 */
export function useTranslation() {
  const [_, setLang] = createSignal<Language>('en');

  // Force re-render when language changes
  const handleLanguageChange = () => {
    if (i18next.isInitialized) {
      setLang(getLanguage());
    }
  };

  onMount(() => {
    // Initialize language when i18next is ready
    if (i18next.isInitialized) {
      setLang(getLanguage());
    } else {
      i18next.on('initialized', () => {
        setLang(getLanguage());
      });
    }

    window.addEventListener('languageChanged', handleLanguageChange);
    // Subscribe to i18next events
    i18next.on('languageChanged', handleLanguageChange);
  });

  onCleanup(() => {
    window.removeEventListener('languageChanged', handleLanguageChange);
    i18next.off('languageChanged', handleLanguageChange);
  });

  // Return translation function
  return (key: string, options?: any) => {
    // Access the signal to create reactivity
    _();
    // Return the translation if i18next is ready, otherwise return the key
    return i18next.isInitialized ? i18next.t(key, options) : key;
  };
}

/**
 * Get current language reactively
 */
export function useLanguage() {
  const [lang, setLang] = createSignal<Language>(getLanguage());

  const handleLanguageChange = () => {
    setLang(getLanguage());
  };

  onMount(() => {
    window.addEventListener('languageChanged', handleLanguageChange);
    i18next.on('languageChanged', handleLanguageChange);
  });

  onCleanup(() => {
    window.removeEventListener('languageChanged', handleLanguageChange);
    i18next.off('languageChanged', handleLanguageChange);
  });

  return lang;
}
