import React from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Role-based route component that redirects to dashboard if user doesn't have required role
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated and authorized
 * @param {Array<string>} props.allowedRoles - Array of roles allowed to access this route
 * @returns {React.ReactElement} Role-based route component
 */
const RoleBasedRoute = ({ children, allowedRoles }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('authToken');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Get user data from localStorage
  const userData = localStorage.getItem('user');
  let userRole = null;
  
  if (userData) {
    try {
      const parsedUser = JSON.parse(userData);
      userRole = parsedUser.role?.toLowerCase();
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  
  // Check if user role is in allowed roles
  const hasRequiredRole = userRole && allowedRoles.includes(userRole);
  
  if (!hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

RoleBasedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default RoleBasedRoute; 