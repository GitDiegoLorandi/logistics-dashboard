import React from 'react';
import PropTypes from 'prop-types';

/**
 * Switch component for toggling options
 */
const Switch = React.forwardRef(({ className = '', checked, onChange, ...props }, ref) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-primary' : 'bg-input'}
        ${className}
      `}
      onClick={() => onChange(!checked)}
      ref={ref}
      {...props}
    >
      <span
        data-state={checked ? 'checked' : 'unchecked'}
        className={`
          pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0
          transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
});

Switch.displayName = 'Switch';

Switch.propTypes = {
  className: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

export { Switch }; 