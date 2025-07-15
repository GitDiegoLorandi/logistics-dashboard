import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files directly
import translationsEN from '../locales/en.json';
import translationsPT from '../locales/pt.json';

// Initialize i18next
i18n
  // Load translations using Backend plugin
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize the configuration
  .init({
    // Default language
    fallbackLng: 'en',
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Namespaces configuration
    ns: [
      'common', 
      'auth', 
      'dashboard', 
      'deliveries', 
      'users', 
      'settings', 
      'navigation', 
      'analytics', 
      'jobs',
      'dataExamples',
      'welcome',
      'deliverers'
    ],
    defaultNS: 'common',
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // React configuration
    react: {
      useSuspense: true,
    },
    // Add resources directly for fallback
    resources: {
      en: translationsEN,
      pt: translationsPT
    },
    // Enable returnObjects option to access nested objects
    returnObjects: true
  });

export default i18n; 