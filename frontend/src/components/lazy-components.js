import { lazy } from 'react';

// Authentication & Layout
export const Login = lazy(() => import('./Login'));
export const Register = lazy(() => import('./register'));
export const ProtectedRoute = lazy(() => import('./protected-route'));
export const RoleBasedRoute = lazy(() => import('./role-based-route'));
export const DashboardLayout = lazy(() => import('./layout/dashboard-layout'));

// Welcome & Dashboard
export const Welcome = lazy(() => import('./welcome'));
export const DashboardOverview = lazy(() => import('./dashboard/dashboard-overview'));

// Main Features
export const DeliveriesPage = lazy(() => import('./deliveries/deliveries-page'));
export const DeliveryTable = lazy(() => import('./deliveries/delivery-table'));
export const DeliveryForm = lazy(() => import('./deliveries/delivery-form'));
export const DeliverersPage = lazy(() => import('./deliverers/deliverers-page'));
export const UsersPage = lazy(() => import('./users/users-page'));
export const AnalyticsPage = lazy(() => import('./analytics/analytics-page'));
export const JobsPage = lazy(() => import('./jobs/jobs-page'));
export const SettingsPage = lazy(() => import('./settings/settings-page'));

// UI Components
export const CommandPalette = lazy(() => import('./ui/command-palette')); 