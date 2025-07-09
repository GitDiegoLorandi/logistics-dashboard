import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook that extends react-i18next's useTranslation with additional functionality
 * 
 * @param {string|string[]} ns - Namespace(s) to use
 * @param {Object} options - Additional options to pass to useTranslation
 * @returns {Object} - Extended translation utilities
 * 
 * @example
 * // Basic usage
 * const { t, tExists, tOr } = useTranslation('common');
 * 
 * // With multiple namespaces
 * const { t, tExists, tOr } = useTranslation(['common', 'auth']);
 * 
 * // With namespace prefix
 * const { t, nsTranslate } = useTranslation('dashboard');
 * console.log(t('title')); // Uses dashboard:title
 * console.log(nsTranslate('common', 'actions.save')); // Uses common:actions.save
 */
export function useTranslation(ns, options = {}) {
  const { t: originalT, i18n, ...rest } = useI18nTranslation(ns, options);
  
  // Extended translation function with fallback value
  const tOr = (key, defaultValue, options = {}) => {
    const translated = originalT(key, { ...options, defaultValue });
    return translated === key ? defaultValue : translated;
  };
  
  // Check if a translation exists
  const tExists = (key, options = {}) => {
    const translated = originalT(key, { ...options });
    return translated !== key;
  };
  
  // Translate with explicit namespace
  const nsTranslate = (namespace, key, options = {}) => {
    return originalT(`${namespace}:${key}`, options);
  };
  
  return {
    t: originalT,
    tOr,
    tExists,
    nsTranslate,
    i18n,
    ...rest
  };
}

/**
 * Format a date according to the current locale
 * 
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 * 
 * @example
 * const { formatDate } = useFormatting();
 * formatDate(new Date(), { dateStyle: 'full' });
 */
export function useFormatting() {
  const { i18n } = useI18nTranslation();
  
  const formatDate = (date, options = {}) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
  };
  
  const formatNumber = (number, options = {}) => {
    return new Intl.NumberFormat(i18n.language, options).format(number);
  };
  
  const formatCurrency = (amount, currency = 'USD', options = {}) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
      ...options,
    }).format(amount);
  };
  
  return {
    formatDate,
    formatNumber,
    formatCurrency
  };
}

export default useTranslation; 