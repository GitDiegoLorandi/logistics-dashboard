import React from 'react';
import PropTypes from 'prop-types';

/**
 * Label component for form fields
 */
const Label = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';

Label.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export { Label }; 