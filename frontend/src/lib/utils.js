import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS classes
 * This utility helps avoid class conflicts when using dynamic classes
 * 
 * @param {...string} inputs - Class names to merge
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency value
 * 
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format date value
 * 
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}, locale = 'en-US') {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
}

/**
 * Truncate text with ellipsis
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Debounce function to limit how often a function can be called
 * 
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Get initials from a name
 * 
 * @param {string} name - Full name
 * @param {number} maxChars - Maximum number of characters to return
 * @returns {string} - Initials
 */
export function getInitials(name, maxChars = 2) {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, maxChars)
    .join('')
    .toUpperCase();
}
