import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  ProtectedRoute,
  DashboardLayout,
  Welcome,
  DashboardOverview,
  DeliveriesPage,
  DeliverersPage,
  UsersPage,
  AnalyticsPage,
  JobsPage,
  SettingsPage
} from './components/lazy-components';
import { useTranslation } from 'react-i18next';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// 404 Not Found Page
const NotFoundPage = () => {
  const { t } = useTranslation('common');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">{t('notFound.title')}</h1>
      <p className="mb-8">{t('notFound.message')}</p>
      <a href="/dashboard" className="text-primary hover:underline">
        {t('notFound.returnToDashboard')}
      </a>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
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
            <Route path="/dashboard/users" element={<UsersPage />} />
            <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
            <Route path="/dashboard/jobs" element={<JobsPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
          </Route>
          
          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all - 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App; 