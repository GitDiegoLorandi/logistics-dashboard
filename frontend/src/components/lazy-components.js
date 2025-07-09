import React, { lazy } from 'react';
import { Skeleton } from './UI/skeleton';

// Loading fallback component
const LoadingFallback = () => (
  <div className="p-4">
    <Skeleton preset="card" className="w-full h-64" />
  </div>
);

// Authentication components
export const Login = lazy(() => import('./login'));
export const ForgotPassword = lazy(() => import('./forgot-password'));
export const ResetPassword = lazy(() => import('./reset-password'));
export const Register = lazy(() => import('./register'));

// Core components
export const ProtectedRoute = lazy(() => import('./protected-route'));
export const DashboardLayout = lazy(() => import('./Layout/dashboard-layout'));
export const Welcome = lazy(() => import('./welcome'));

// Page components
export const DashboardOverview = lazy(() => import('./Dashboard/dashboard-overview'));
export const DeliveriesPage = lazy(() => import('./Deliveries/deliveries-page'));
export const DeliveryForm = lazy(() => import('./Deliveries/delivery-form'));
export const DeliverersPage = lazy(() => import('./Deliverers/deliverers-page'));
export const UsersPage = lazy(() => import('./Users/users-page'));
export const AnalyticsPage = lazy(() => import('./Analytics/analytics-page'));
export const JobsPage = lazy(() => import('./Jobs/jobs-page'));
export const SettingsPage = lazy(() => import('./Settings/settings-page')); 