import React, { lazy } from 'react';

/**
 * Helper function for lazy loading components, especially those with named exports
 * 
 * @param {Function} factory - The import function
 * @param {string} exportName - The name of the export to extract
 * @returns {React.LazyExoticComponent} - The lazy-loaded component
 * 
 * @example
 * // For default exports:
 * const Dashboard = lazyImport(() => import('./components/Dashboard'));
 * 
 * // For named exports:
 * const { Button } = lazyImport(() => import('./components/UI'), 'Button');
 */
export function lazyImport(factory, exportName) {
  const LazyComponent = lazy(async () => {
    const module = await factory();
    
    // Handle named exports
    if (exportName) {
      return { default: module[exportName] };
    }
    
    return module;
  });
  
  // Return an object with the same shape as the import if using named exports
  if (exportName) {
    return { [exportName]: LazyComponent };
  }
  
  return LazyComponent;
}

/**
 * Creates a lazy-loaded component with a custom loading fallback
 * 
 * @param {Function} importFn - The import function
 * @param {React.ReactNode} fallback - The fallback component to show while loading
 * @returns {React.FC} - The wrapped component with Suspense
 * 
 * @example
 * const LazyChart = lazyWithFallback(
 *   () => import('./components/Chart'),
 *   <Skeleton preset="chart" />
 * );
 */
export function lazyWithFallback(importFn, fallback) {
  const LazyComponent = lazy(importFn);
  
  // Extract component name from import function for better debugging
  const getComponentName = () => {
    const importPath = importFn.toString().match(/import\(['"](.+)['"]\)/);
    if (importPath && importPath[1]) {
      const parts = importPath[1].split('/');
      return `Lazy(${parts[parts.length - 1]})`;
    }
    return 'LazyComponent';
  };
  
  const LazyWithSuspense = (props) => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
  
  // Set display name for better debugging
  LazyWithSuspense.displayName = getComponentName();
  
  return LazyWithSuspense;
} 