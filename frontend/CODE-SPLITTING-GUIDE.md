# Code-Splitting Guide

This guide explains how code-splitting is implemented in the Logistics Dashboard application to improve performance and load times.

## Overview

Code-splitting is a technique that allows you to split your JavaScript bundle into smaller chunks that are loaded on demand. This improves the initial load time of your application by only loading the code that is needed for the current view.

In our implementation, we use React's `React.lazy()` and `Suspense` features along with our custom utilities to make code-splitting easy to implement and maintain.

## Key Components

### 1. React.lazy and Suspense

We use React's built-in lazy loading mechanism:

```jsx
const SomeComponent = React.lazy(() => import('./SomeComponent'));

// Usage with Suspense
<Suspense fallback={<LoadingComponent />}>
  <SomeComponent />
</Suspense>
```

### 2. Skeleton Components

We use the `Skeleton` component to provide visual feedback while components are loading:

```jsx
// Available presets:
// - table
// - card
// - avatar
// - form
// - stats
// - chart
<Skeleton preset="table" rows={10} columns={4} />
```

### 3. Utility Functions

#### lazyImport

Handles both default and named exports:

```jsx
// For default exports
const Dashboard = lazyImport(() => import('./components/Dashboard'));

// For named exports
const { Button } = lazyImport(() => import('./components/UI'), 'Button');
```

#### lazyWithFallback

Creates a component with built-in Suspense and fallback:

```jsx
const LazyChart = lazyWithFallback(
  () => import('./components/Chart'),
  <Skeleton preset="chart" />
);
```

#### useDynamicImport

A hook for more fine-grained control over dynamic imports:

```jsx
const { 
  Component, 
  loading, 
  error, 
  load,
  LoadingComponent 
} = useDynamicImport(
  () => import('./components/HeavyComponent'),
  { skeletonType: 'chart' }
);
```

## Implementation Patterns

### 1. Route-based Code Splitting

We split code at the route level using lazy-loaded components in `App.js`:

```jsx
// In App.js
import {
  Login,
  DashboardLayout,
  DashboardOverview,
  // ...other components
} from './components/lazyComponents';

// Usage in routes
<Route path="/dashboard" element={<DashboardOverview />} />
```

### 2. Component-level Code Splitting

For large components that aren't immediately needed:

```jsx
// In a component file
const { Component: Chart, loading, error } = useDynamicImport(
  () => import('./Chart'),
  { skeletonType: 'chart' }
);

// Usage
{loading && <LoadingComponent />}
{Chart && <Chart data={data} />}
```

### 3. On-demand Loading

For components that should only load after user interaction:

```jsx
const { Component: Modal, load: loadModal } = useDynamicImport(
  () => import('./Modal')
);

// Load on button click
<button onClick={loadModal}>Open Modal</button>
```

## Best Practices

1. **Split at meaningful boundaries**: Split at route level or for large, independent features
2. **Use appropriate skeletons**: Match the skeleton type to the component being loaded
3. **Avoid over-splitting**: Don't split tiny components as it can increase HTTP requests
4. **Preload critical paths**: Consider preloading components that are likely to be needed soon
5. **Handle errors gracefully**: Always provide error handling for failed imports
6. **Monitor performance**: Use browser dev tools to verify bundle sizes and loading behavior

## Example Usage

See `DynamicImportExample.js` for a practical demonstration of using dynamic imports with tabs.

## Further Resources

- [React Code-Splitting Documentation](https://reactjs.org/docs/code-splitting.html)
- [Webpack Code Splitting Guide](https://webpack.js.org/guides/code-splitting/)
- [Performance Monitoring with Lighthouse](https://developers.google.com/web/tools/lighthouse) 