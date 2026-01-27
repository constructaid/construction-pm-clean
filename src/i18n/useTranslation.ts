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

    if (typeof window !== 'undefined') {
      window.addEventListener('languageChanged', handleLanguageChange);
    }
    // Subscribe to i18next events
    i18next.on('languageChanged', handleLanguageChange);
  });

  onCleanup(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('languageChanged', handleLanguageChange);
    }
    i18next.off('languageChanged', handleLanguageChange);
  });

  // Return translation function
  return (key: string, options?: any): string => {
    // Access the signal to create reactivity
    _();
    // Return the translation if i18next is ready, otherwise return the key
    const result = i18next.isInitialized ? i18next.t(key, options) : key;
    return typeof result === 'string' ? result : key;
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
    if (typeof window !== 'undefined') {
      window.addEventListener('languageChanged', handleLanguageChange);
    }
    i18next.on('languageChanged', handleLanguageChange);
  });

  onCleanup(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('languageChanged', handleLanguageChange);
    }
    i18next.off('languageChanged', handleLanguageChange);
  });

  return lang;
}
