import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card component for containing content
 */
const Card = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardContent component for padding content inside cards
 */
const CardContent = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export { Card, CardContent }; 