import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

/**
 * Card component for containing content with theme support
 */
const Card = ({ 
  className = '', 
  children, 
  variant = 'default',
  isInteractive = false,
  animate = false,
  hoverEffect = 'shadow', // new prop: shadow, lift, glow, or none
  ...props 
}) => {
  const baseClasses = 'rounded-lg border transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-[var(--color-card-bg)] border-[var(--color-border)] shadow-[var(--shadow-sm)]',
    primary: 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] border-[var(--color-primary)] text-white',
    secondary: 'bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-secondary-dark)] border-[var(--color-secondary)] text-white',
    accent: 'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dark)] border-[var(--color-accent)] text-white',
    outline: 'bg-transparent border-[var(--color-border)] shadow-none',
    ghost: 'border-none shadow-none bg-transparent',
  };
  
  // Hover effect classes
  const getHoverClasses = () => {
    if (!isInteractive) return '';
    
    switch(hoverEffect) {
      case 'shadow':
        return 'hover:shadow-[var(--shadow-lg)] cursor-pointer';
      case 'lift':
        return 'hover:shadow-[var(--shadow-md)] hover:-translate-y-1 cursor-pointer';
      case 'glow':
        return 'hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)] cursor-pointer';
      case 'none':
      default:
        return 'cursor-pointer';
    }
  };

  const interactiveClasses = getHoverClasses();

  const CardComponent = animate ? motion.div : 'div';
  
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};
    
  return (
    <CardComponent
      className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
      {...animationProps}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

/**
 * CardHeader component for card headers with title and actions
 */
const CardHeader = ({ 
  className = '', 
  children, 
  title, 
  subtitle,
  icon,
  action,
  gradient = false,
  ...props 
}) => {
  const titleClasses = gradient ? 'gradient-text' : '';
  
  return (
    <div
      className={`flex items-center justify-between p-6 pb-3 ${className}`}
      {...props}
    >
      <div className="flex items-center space-x-4">
        {icon && <div className="text-[var(--color-primary)]">{icon}</div>}
        <div>
          {title && <h3 className={`text-lg font-semibold ${titleClasses}`}>{title}</h3>}
          {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
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
      className={`p-6 pt-3 text-[var(--text-primary)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardFooter component for card footers with actions
 */
const CardFooter = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`flex items-center justify-between p-6 pt-3 border-t border-[var(--color-border)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'accent', 'outline', 'ghost']),
  isInteractive: PropTypes.bool,
  animate: PropTypes.bool,
  hoverEffect: PropTypes.oneOf(['shadow', 'lift', 'glow', 'none']),
};

CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  icon: PropTypes.node,
  action: PropTypes.node,
  gradient: PropTypes.bool,
};

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

CardFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export { Card, CardHeader, CardContent, CardFooter }; 