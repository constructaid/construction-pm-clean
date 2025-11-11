import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import es from './es.json';

// Initialize i18next
i18next
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],
      // Keys to look up language in localStorage
      lookupLocalStorage: 'i18nextLng',
      // Cache user language
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false // React/Solid already escape values
    }
  });

export default i18next;

export type Language = 'en' | 'es';

export const languages = {
  en: 'English',
  es: 'Español'
} as const;

export const getLanguage = (): Language => {
  return (i18next.language as Language) || 'en';
};

export const setLanguage = (lang: Language): void => {
  i18next.changeLanguage(lang);
  localStorage.setItem('i18nextLng', lang);
  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
};
