import { useEffect, useState } from 'react';

/**
 * Custom hook for automatically saving form data to sessionStorage
 * 
 * @param {string} key - Unique key to identify the form data in sessionStorage
 * @param {Object} initialValues - Initial form values
 * @param {number} debounceMs - Debounce time in milliseconds (default: 500)
 * @returns {[Object, Function]} - [formValues, setFormValues]
 */
const useFormAutosave = (key, initialValues = {}, debounceMs = 500) => {
  // Try to load saved values from sessionStorage
  const loadSavedValues = () => {
    try {
      const savedValues = sessionStorage.getItem(key);
      if (savedValues) {
        return JSON.parse(savedValues);
      }
    } catch (error) {
      console.error('Error loading saved form values:', error);
    }
    return initialValues;
  };

  const [values, setValues] = useState(loadSavedValues);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Save values to sessionStorage when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(values));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving form values:', error);
      }
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [values, key, debounceMs]);
  
  /**
   * Clear saved form data
   */
  const clearSavedData = () => {
    try {
      sessionStorage.removeItem(key);
      setValues(initialValues);
      setLastSaved(null);
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };
  
  return [values, setValues, { lastSaved, clearSavedData }];
};

export default useFormAutosave; 