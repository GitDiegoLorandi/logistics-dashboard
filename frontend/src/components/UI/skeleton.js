import React from 'react';
import PropTypes from 'prop-types';

/**
 * Skeleton component for loading state
 */
const Skeleton = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  ...props 
}) => {
  const baseClasses = 'animate-pulse bg-[var(--color-border)]';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'h-4 rounded w-2/3',
  };
  
  const style = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      {...props}
      role="status"
      aria-label="Loading..."
    />
  );
};

/**
 * SkeletonText component for text placeholder loading states
 */
const SkeletonText = ({ lines = 3, className = '', ...props }) => {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Loading content...">
      {Array(lines)
        .fill(0)
        .map((_, i) => (
          <Skeleton 
            key={i} 
            className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
            variant="text"
            {...props} 
          />
        ))}
    </div>
  );
};

/**
 * SkeletonCard component for card placeholder loading states
 */
const SkeletonCard = ({ className = '', headerAction = false, footerAction = false, ...props }) => {
  return (
    <div 
      className={`rounded-lg border border-[var(--color-border)] p-6 ${className}`} 
      role="status"
      aria-label="Loading card..."
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" variant="text" />
          <Skeleton className="h-4 w-24" variant="text" />
        </div>
        {headerAction && <Skeleton className="h-8 w-8 rounded-full" />}
      </div>
      
      <div className="space-y-4 my-6">
        <Skeleton className="h-20 w-full" />
        <SkeletonText lines={2} />
      </div>
      
      {footerAction && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      )}
    </div>
  );
};

/**
 * SkeletonTable component for table placeholder loading states
 */
const SkeletonTable = ({ rows = 5, cols = 4, className = '', ...props }) => {
  return (
    <div className={`rounded-lg border border-[var(--color-border)] overflow-hidden ${className}`} {...props}>
      {/* Header */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--input-bg)] p-4">
        {Array(cols).fill(0).map((_, i) => (
          <div key={`header-${i}`} className="flex-1 px-2">
            <Skeleton className="h-6" />
          </div>
        ))}
      </div>
      
      {/* Rows */}
      {Array(rows).fill(0).map((_, i) => (
        <div key={`row-${i}`} className="flex border-b border-[var(--color-border)] p-4">
          {Array(cols).fill(0).map((_, j) => (
            <div key={`cell-${i}-${j}`} className="flex-1 px-2">
              <Skeleton className="h-6" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['rectangular', 'circular', 'text']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
  className: PropTypes.string,
};

SkeletonCard.propTypes = {
  className: PropTypes.string,
  headerAction: PropTypes.bool,
  footerAction: PropTypes.bool,
};

SkeletonTable.propTypes = {
  rows: PropTypes.number,
  cols: PropTypes.number,
  className: PropTypes.string,
};

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable }; 