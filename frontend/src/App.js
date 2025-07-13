import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardOverview from './components/Dashboard/DashboardOverview';
import DeliveriesPage from './components/Deliveries/DeliveriesPage';
import DeliverersPage from './components/Deliverers/DeliverersPage';
import UsersPage from './components/Users/UsersPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import JobsPage from './components/Jobs/JobsPage';
import SettingsPage from './components/Settings/SettingsPage';

// Styles

function App() {
  return (
    <Router>
      <div className='App'>
        <Routes>
          {/* Public Routes */}
          <Route path='/login' element={<Login />} />

          {/* Protected Dashboard Routes */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard Pages */}
            <Route index element={<DashboardOverview />} />
            <Route path='deliveries' element={<DeliveriesPage />} />
            <Route path='deliverers' element={<DeliverersPage />} />
            <Route path='users' element={<UsersPage />} />
            <Route path='analytics' element={<AnalyticsPage />} />
            <Route path='jobs' element={<JobsPage />} />
            <Route path='settings' element={<SettingsPage />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path='/' element={<Navigate to='/dashboard' replace />} />

          {/* 404 Route */}
          <Route path='*' element={<Navigate to='/dashboard' replace />} />
        </Routes>

        {/* Toast Notifications */}
        <ToastContainer
          position='top-right'
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='light'
        />
      </div>
    </Router>
  );
}

export default App;
