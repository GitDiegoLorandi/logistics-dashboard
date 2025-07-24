import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '../components/UI/skeleton';

/**
 * Custom hook for dynamically importing components on demand
 * 
 * @param {Function} importFn - The import function to call
 * @param {Object} options - Additional options
 * @param {string} options.skeletonType - The type of skeleton to show while loading
 * @param {boolean} options.immediate - Whether to load immediately or on demand
 * @returns {Object} - The component state and control functions
 * 
 * @example
 * // Basic usage
 * const { Component, loading, error, load } = useDynamicImport(
 *   () => import('../components/HeavyComponent'),
 *   { skeletonType: 'chart' }
 * );
 * 
 * // In your component
 * return (
 *   <div>
 *     {loading && <Skeleton preset={skeletonType} />}
 *     {error && <div>Error loading component</div>}
 *     {Component && <Component {...props} />}
 *     {!Component && !loading && <button onClick={load}>Load Component</button>}
 *   </div>
 * );
 */
export function useDynamicImport(importFn, options = {}) {
  const { skeletonType = 'card', immediate = false } = options;
  
  const [state, setState] = useState({
    Component: null,
    loading: immediate,
    error: null,
    loaded: false
  });
  
  const load = useCallback(() => {
    setState(prevState => {
      // Return early without state change if already loaded or loading
      if (prevState.loaded || prevState.loading) return prevState;
      
      // Set loading state
      return { ...prevState, loading: true };
    });
    
    importFn()
      .then(module => {
        setState({
          Component: module.default,
          loading: false,
          error: null,
          loaded: true
        });
      })
      .catch(error => {
        console.error('Error dynamically importing component:', error);
        setState({
          Component: null,
          loading: false,
          error: error.message || 'Failed to load component',
          loaded: false
        });
      });
  }, [importFn]);
  
  // Load immediately if specified
  useEffect(() => {
    if (immediate) {
      load();
    }
  }, [immediate, load]);
  
  // Create a loading component based on the skeleton type
  const LoadingComponent = () => <Skeleton preset={skeletonType} />;
  
  return {
    ...state,
    load,
    LoadingComponent
  };
}

/**
 * Higher-order component that wraps a component with dynamic import functionality
 * 
 * @param {Function} importFn - The import function to call
 * @param {Object} options - Additional options
 * @returns {React.FC} - The wrapped component
 * 
 * @example
 * const LazyChart = withDynamicImport(() => import('./Chart'), { 
 *   skeletonType: 'chart',
 *   immediate: true
 * });
 * 
 * // Then use it like a regular component
 * <LazyChart data={chartData} />
 */
export function withDynamicImport(importFn, options = {}) {
  return function DynamicComponent(props) {
    const { Component, loading, error, LoadingComponent } = useDynamicImport(importFn, {
      ...options,
      immediate: true
    });
    
    if (loading) {
      return <LoadingComponent />;
    }
    
    if (error) {
      return <div className="text-destructive">Failed to load component: {error}</div>;
    }
    
    if (!Component) {
      return null;
    }
    
    return <Component {...props} />;
  };
} 