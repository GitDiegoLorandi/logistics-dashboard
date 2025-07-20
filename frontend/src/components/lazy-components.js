import { lazy } from 'react';

// Authentication & Layout
export const Login = lazy(() => import('./Login'));
export const Register = lazy(() => import('./register'));
export const ProtectedRoute = lazy(() => import('./protected-route'));
export const RoleBasedRoute = lazy(() => import('./role-based-route'));
export const DashboardLayout = lazy(() => import('./Layout/dashboard-layout'));

// Welcome & Dashboard
export const Welcome = lazy(() => import('./welcome'));
export const DashboardOverview = lazy(() => import('./Dashboard/dashboard-overview'));

// Main Features
export const DeliveriesPage = lazy(() => import('./Deliveries/deliveries-page'));
export const DeliveryTable = lazy(() => import('./Deliveries/delivery-table'));
export const DeliveryForm = lazy(() => import('./Deliveries/delivery-form'));
export const DeliverersPage = lazy(() => import('./Deliverers/deliverers-page'));
export const UsersPage = lazy(() => import('./Users/users-page'));
export const JobsPage = lazy(() => import('./Jobs/jobs-page'));
export const SettingsPage = lazy(() => import('./Settings/settings-page'));

// UI Components
export const CommandPaletteComponent = lazy(() => import('./UI/command-palette').then(module => ({ default: module.CommandPalette }))); 