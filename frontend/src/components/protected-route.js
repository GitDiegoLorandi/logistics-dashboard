import React from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../services/api';

/**
 * Protected route component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated using the authAPI helper
  const isAuthenticated = authAPI.isAuthenticated();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
