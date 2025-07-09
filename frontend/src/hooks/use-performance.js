import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for performance monitoring and measurement
 * 
 * @param {Object} options - Hook options
 * @param {string} options.id - Unique identifier for the measurement
 * @param {boolean} options.enabled - Whether to enable performance monitoring (default: true)
 * @param {boolean} options.logToConsole - Whether to log measurements to console (default: false)
 * @param {Function} options.onMeasure - Callback when a measurement is completed
 * @returns {Object} - Performance measurement methods
 */
const usePerformance = ({
  id,
  enabled = true,
  logToConsole = false,
  onMeasure,
} = {}) => {
  const marksRef = useRef({});
  const measuresRef = useRef({});
  
  // Check if the Performance API is available
  const isSupported = typeof window !== 'undefined' && 
    typeof window.performance !== 'undefined' && 
    typeof window.performance.mark === 'function';

  // Generate a unique mark name
  const getMarkName = useCallback((name) => {
    return `${id ? `${id}-` : ''}${name}`;
  }, [id]);

  // Start measuring performance
  const startMeasure = useCallback((name) => {
    if (!enabled || !isSupported) return;

    const markName = getMarkName(`${name}-start`);
    marksRef.current[name] = {
      start: markName,
      startTime: performance.now(),
    };
    
    performance.mark(markName);
    
    return markName;
  }, [enabled, isSupported, getMarkName]);

  // End measuring performance
  const endMeasure = useCallback((name) => {
    if (!enabled || !isSupported || !marksRef.current[name]) return;

    const { start, startTime } = marksRef.current[name];
    const endMarkName = getMarkName(`${name}-end`);
    const measureName = getMarkName(name);
    
    performance.mark(endMarkName);
    
    try {
      performance.measure(measureName, start, endMarkName);
      
      const entries = performance.getEntriesByName(measureName);
      const duration = entries.length > 0 
        ? entries[0].duration 
        : performance.now() - startTime;
      
      measuresRef.current[name] = duration;
      
      if (logToConsole) {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      }
      
      if (onMeasure) {
        onMeasure({
          name,
          duration,
          timestamp: Date.now(),
        });
      }
      
      return duration;
    } catch (error) {
      console.error(`[Performance] Error measuring ${name}:`, error);
      return null;
    } finally {
      // Clean up marks to prevent memory leaks
      try {
        performance.clearMarks(start);
        performance.clearMarks(endMarkName);
        performance.clearMeasures(measureName);
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  }, [enabled, isSupported, getMarkName, logToConsole, onMeasure]);

  // Measure a function's execution time
  const measureFunction = useCallback((name, fn, ...args) => {
    if (!enabled || !isSupported) {
      return fn(...args);
    }

    startMeasure(name);
    try {
      return fn(...args);
    } finally {
      endMeasure(name);
    }
  }, [enabled, isSupported, startMeasure, endMeasure]);

  // Measure an async function's execution time
  const measureAsync = useCallback(async (name, asyncFn, ...args) => {
    if (!enabled || !isSupported) {
      return await asyncFn(...args);
    }

    startMeasure(name);
    try {
      return await asyncFn(...args);
    } finally {
      endMeasure(name);
    }
  }, [enabled, isSupported, startMeasure, endMeasure]);

  // Get all measurements
  const getMeasurements = useCallback(() => {
    return { ...measuresRef.current };
  }, []);

  // Clear all measurements
  const clearMeasurements = useCallback(() => {
    measuresRef.current = {};
    if (isSupported) {
      try {
        performance.clearMarks();
        performance.clearMeasures();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  }, [isSupported]);

  // Store getMarkName in a ref to avoid dependency changes
  const getMarkNameRef = useRef(getMarkName);
  useEffect(() => {
    getMarkNameRef.current = getMarkName;
  }, [getMarkName]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        try {
          // Capture current marks to avoid the ref changing during cleanup
          const currentMarks = { ...marksRef.current };
          
          // Clear only the marks and measures created by this hook instance
          Object.keys(currentMarks).forEach((name) => {
            const { start } = currentMarks[name];
            const endMarkName = getMarkNameRef.current(`${name}-end`);
            const measureName = getMarkNameRef.current(name);
            
            performance.clearMarks(start);
            performance.clearMarks(endMarkName);
            performance.clearMeasures(measureName);
          });
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [isSupported]); // Remove getMarkName from dependencies, use ref instead

  return {
    startMeasure,
    endMeasure,
    measureFunction,
    measureAsync,
    getMeasurements,
    clearMeasurements,
    isSupported,
  };
};

export default usePerformance; 