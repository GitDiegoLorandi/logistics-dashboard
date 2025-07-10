import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ size = 'md', className = '', ...props }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center justify-center ${className}`} {...props}>
      <div
        className={`${sizeClass} animate-spin rounded-full border-b-transparent border-l-transparent border-r-transparent border-t-primary`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

export default LoadingSpinner; 