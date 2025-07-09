import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './report-web-vitals';

// Import i18n configuration
import './i18n/config';

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-full max-w-md h-64"></div>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
