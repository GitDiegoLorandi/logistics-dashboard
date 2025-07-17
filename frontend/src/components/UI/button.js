import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button component with various variants and sizes
 */
const Button = React.forwardRef(({
  className = '',
  variant = 'default',
  size = 'default',
  children,
  isLoading = false,
  startIcon,
  endIcon,
  gradient = false,
  ...props
}, ref) => {
  // Button variants - updated with CSS variables and gradients
  const variants = {
    default: gradient 
      ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5' 
      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] hover:shadow-[var(--shadow-md)]',
    destructive: gradient 
      ? 'bg-gradient-to-r from-[var(--color-error)] to-[#b91c1c] text-white hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5' 
      : 'bg-[var(--color-error)] text-white hover:bg-opacity-90 hover:shadow-[var(--shadow-md)]',
    outline: 'border border-[var(--color-border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--input-bg)] hover:border-[var(--color-primary-light)]',
    secondary: gradient 
      ? 'bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-dark)] text-white hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5' 
      : 'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-dark)] hover:shadow-[var(--shadow-md)]',
    accent: gradient 
      ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5' 
      : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)] hover:shadow-[var(--shadow-md)]',
    ghost: 'hover:bg-[var(--input-bg)] text-[var(--text-primary)]',
    link: 'text-[var(--color-primary)] underline-offset-4 hover:underline hover:text-[var(--color-primary-light)]',
  };

  // Button sizes
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3 text-sm',
    lg: 'h-11 rounded-md px-8 text-lg',
    icon: 'h-10 w-10',
  };

  // Base classes - enhanced with transitions and focus states
  const baseClasses = 'relative inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-sm)]';

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      ref={ref}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span className={isLoading ? "invisible" : "flex items-center gap-2"}>
        {startIcon && <span className="mr-1">{startIcon}</span>}
        {children}
        {endIcon && <span className="ml-1">{endIcon}</span>}
      </span>
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'destructive', 'outline', 'secondary', 'accent', 'ghost', 'link']),
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  children: PropTypes.node,
  isLoading: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  gradient: PropTypes.bool,
  disabled: PropTypes.bool,
};

export { Button }; 