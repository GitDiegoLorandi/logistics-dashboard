import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Select component for forms with proper dark mode support
 */
const Select = React.forwardRef(({ className = '', children, ...props }, ref) => {
  // Apply CSS to ensure dropdown options match the modal's theme
  useEffect(() => {
    // Add CSS for select dropdown styling
    const styleId = 'select-dropdown-styles';
    
    // Only add if it doesn't exist yet
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        select {
          color: var(--text-primary);
          background-color: var(--color-card-bg);
        }
        
        select option {
          color: var(--text-primary);
          background-color: var(--color-card-bg);
        }
        
        /* For dark mode specifics */
        [data-theme="dark"] select,
        [data-theme="dark"] select option,
        .dark select,
        .dark select option {
          background-color: var(--color-card-bg);
          color: var(--text-primary);
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // We'll keep the styles for the entire session
      // If cleanup is needed: document.getElementById(styleId)?.remove();
    };
  }, []);
  
  return (
    <select
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export { Select }; 