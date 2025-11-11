import { createSignal, onMount, onCleanup } from 'solid-js';
import i18next, { getLanguage, type Language } from './config';

/**
 * Solid.js hook for translations
 * Usage: const t = useTranslation();
 * Then: t('common.save') or t('field.dailyReports')
 */
export function useTranslation() {
  const [_, setLang] = createSignal<Language>(getLanguage());

  // Force re-render when language changes
  const handleLanguageChange = () => {
    setLang(getLanguage());
  };

  onMount(() => {
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
    return i18next.t(key, options);
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
