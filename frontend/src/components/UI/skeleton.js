import React from 'react';
import PropTypes from 'prop-types';

/**
 * Skeleton component for loading states
 * 
 * @param {Object} props - Component props
 * @param {string} props.preset - Preset type ('card', 'chart', 'text', 'avatar', 'table')
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactElement} Skeleton component
 */
const Skeleton = ({ preset = 'text', className = '', ...props }) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';
  
  // Different skeleton presets
  const presets = {
    text: `${baseClasses} h-4 w-full my-1`,
    card: `${baseClasses} h-40 w-full`,
    chart: `${baseClasses} h-64 w-full`,
    avatar: `${baseClasses} h-12 w-12 rounded-full`,
    table: `${baseClasses} h-96 w-full`,
    button: `${baseClasses} h-10 w-24`,
    input: `${baseClasses} h-10 w-full`,
    badge: `${baseClasses} h-6 w-16 rounded-full`,
  };

  // Generate multiple text lines for paragraph preset
  if (preset === 'paragraph') {
    return (
      <div className={className} {...props}>
        <div className={`${baseClasses} mb-2 h-4 w-full`}></div>
        <div className={`${baseClasses} mb-2 h-4 w-5/6`}></div>
        <div className={`${baseClasses} mb-2 h-4 w-4/6`}></div>
        <div className={`${baseClasses} h-4 w-3/6`}></div>
      </div>
    );
  }

  // Generate table skeleton
  if (preset === 'table') {
    return (
      <div className={`${className} space-y-2`} {...props}>
        <div className={`${baseClasses} mb-4 h-10 w-full`}></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`${baseClasses} h-12 w-full`}></div>
        ))}
      </div>
    );
  }

  // Generate form skeleton
  if (preset === 'form') {
    return (
      <div className={`${className} space-y-4`} {...props}>
        <div className={`${baseClasses} mb-1 h-4 w-24`}></div>
        <div className={`${baseClasses} mb-4 h-10 w-full`}></div>
        
        <div className={`${baseClasses} mb-1 h-4 w-24`}></div>
        <div className={`${baseClasses} mb-4 h-10 w-full`}></div>
        
        <div className={`${baseClasses} mb-1 h-4 w-24`}></div>
        <div className={`${baseClasses} mb-4 h-10 w-full`}></div>
        
        <div className={`${baseClasses} mt-6 h-10 w-32`}></div>
      </div>
    );
  }

  // Default preset
  return <div className={`${presets[preset] || presets.text} ${className}`} {...props}></div>;
};

Skeleton.propTypes = {
  preset: PropTypes.oneOf([
    'text', 
    'card', 
    'chart', 
    'avatar', 
    'table', 
    'paragraph', 
    'button', 
    'form',
    'input',
    'badge'
  ]),
  className: PropTypes.string,
};

export { Skeleton }; 