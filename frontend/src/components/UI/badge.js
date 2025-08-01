import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge component for status indicators
 */
const Badge = ({ variant = 'default', className = '', children, ...props }) => {
  // Badge variants
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
    success: 'bg-green-500 text-white hover:bg-green-600',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    info: 'bg-blue-500 text-white hover:bg-blue-600',
    pending: 'bg-yellow-500 text-white hover:bg-yellow-600',
    inProgress: 'bg-blue-500 text-white hover:bg-blue-600',
    completed: 'bg-green-500 text-white hover:bg-green-600',
    cancelled: 'bg-gray-500 text-white hover:bg-gray-600',
    delayed: 'bg-orange-500 text-white hover:bg-orange-600',
    onHold: 'bg-purple-500 text-white hover:bg-purple-600',
    // Delivery status badges
    PENDING: 'bg-yellow-500 text-white hover:bg-yellow-600',
    IN_TRANSIT: 'bg-blue-500 text-white hover:bg-blue-600',
    DELIVERED: 'bg-green-500 text-white hover:bg-green-600',
    CANCELLED: 'bg-gray-500 text-white hover:bg-gray-600',
    DELAYED: 'bg-orange-500 text-white hover:bg-orange-600',
    ON_HOLD: 'bg-purple-500 text-white hover:bg-purple-600',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf([
    'default',
    'secondary',
    'destructive',
    'outline',
    'success',
    'warning',
    'info',
    'pending',
    'inProgress',
    'completed',
    'cancelled',
    'delayed',
    'onHold',
    'PENDING',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
    'DELAYED',
    'ON_HOLD',
  ]),
  className: PropTypes.string,
  children: PropTypes.node,
};

export { Badge }; 