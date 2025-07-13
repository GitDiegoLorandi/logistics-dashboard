import { useRef, useEffect } from 'react';
import usePerformance from './use-performance';

/**
 * Custom hook for monitoring component render performance
 * 
 * @param {Object} options - Hook options
 * @param {string} options.componentName - Name of the component (default: 'Component')
 * @param {boolean} options.enabled - Whether to enable monitoring (default: true)
 * @param {boolean} options.logToConsole - Whether to log measurements to console (default: false)
 * @param {Function} options.onRender - Callback when a render is completed
 * @returns {Object} - Component render performance data
 */
const useComponentRender = ({
  componentName = 'Component',
  enabled = true,
  logToConsole = false,
  onRender,
} = {}) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(null);
  
  // Use the performance hook for measurements
  const performance = usePerformance({
    id: `render-${componentName}`,
    enabled,
    logToConsole,
    onMeasure: (data) => {
      if (onRender) {
        onRender({
          ...data,
          renderCount: renderCountRef.current,
          componentName,
        });
      }
    },
  });

  // Start measuring on mount and track render count
  useEffect(() => {
    if (!enabled) return;
    
    renderCountRef.current += 1;
    const renderName = `render-${renderCountRef.current}`;
    
    performance.startMeasure(renderName);
    
    return () => {
      const duration = performance.endMeasure(renderName);
      lastRenderTimeRef.current = duration;
      
      if (logToConsole) {
        console.log(`[Render] ${componentName} #${renderCountRef.current}: ${duration?.toFixed(2)}ms`);
      }
    };
  }, [componentName, enabled, logToConsole, performance]);

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
    isSupported: performance.isSupported,
  };
};

/**
 * Higher-order component that wraps a component with render performance monitoring
 * 
 * @param {React.ComponentType} Component - Component to wrap
 * @param {Object} options - Options for the useComponentRender hook
 * @returns {React.ComponentType} - Wrapped component with render performance monitoring
 */
export const withRenderPerformance = (Component, options = {}) => {
  const WrappedComponent = (props) => {
    const componentName = options.componentName || Component.displayName || Component.name || 'Component';
    
    useComponentRender({
      componentName,
      ...options,
    });
    
    return <Component {...props} />;
  };
  
  const displayName = options.componentName || Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `WithRenderPerformance(${displayName})`;
  
  return WrappedComponent;
};

export default useComponentRender; 