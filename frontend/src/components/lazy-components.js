import React, { lazy } from 'react';
import { Skeleton } from './ui/skeleton';

// Loading fallback component
const LoadingFallback = () => (
  <div className="p-4">
    <Skeleton preset="card" className="h-64 w-full" />
  </div>
);

// Authentication components
export const Login = lazy(() => import('./Login'));

// Core components
export const ProtectedRoute = lazy(() => import('./protected-route'));
export const DashboardLayout = lazy(() => import('./layout/dashboard-layout'));
export const Welcome = lazy(() => import('./welcome'));

// Page components
export const DashboardOverview = lazy(() => import('./dashboard/dashboard-overview'));
export const DeliveriesPage = lazy(() => import('./deliveries/deliveries-page'));
export const DeliveryForm = lazy(() => import('./deliveries/delivery-form'));
export const DeliverersPage = lazy(() => import('./deliverers/deliverers-page'));
export const UsersPage = lazy(() => import('./users/users-page'));
export const AnalyticsPage = lazy(() => import('./analytics/analytics-page'));
export const JobsPage = lazy(() => import('./jobs/jobs-page'));
export const SettingsPage = lazy(() => import('./settings/settings-page')); 