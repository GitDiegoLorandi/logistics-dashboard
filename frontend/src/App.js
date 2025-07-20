import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import {
  Login,
  ProtectedRoute,
  RoleBasedRoute,
  DashboardLayout,
  Welcome,
  DashboardOverview,
  DeliveriesPage,
  DeliverersPage,
  UsersPage,
  JobsPage,
  SettingsPage
} from './components/lazy-components';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import { SkipLink } from './components/UI/a11y';
import './styles/theme.css';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[var(--color-primary)]"></div>
  </div>
);

// 404 Not Found Page
const NotFoundPage = () => {
  const { t } = useTranslation('common');
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-4xl font-bold">{t('notFound.title')}</h1>
      <p className="mb-8">{t('notFound.message')}</p>
      <a href="/dashboard" className="text-[var(--color-primary)] hover:underline">
        {t('notFound.returnToDashboard')}
      </a>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <SkipLink targetId="main-content" />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Authentication routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Welcome page */}
            <Route path="/welcome" element={<Welcome />} />
            
            {/* Protected dashboard routes */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/dashboard/deliveries" element={<DeliveriesPage />} />
              <Route path="/dashboard/deliverers" element={<DeliverersPage />} />
              
              {/* Admin-only routes */}
              <Route path="/dashboard/users" element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/jobs" element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <JobsPage />
                </RoleBasedRoute>
              } />
              
              <Route path="/dashboard/settings" element={<SettingsPage />} />
            </Route>
            
            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all - 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App; 