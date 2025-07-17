import React from 'react';
import PropTypes from 'prop-types';

/**
 * Table component
 */
const Table = React.forwardRef(({ 
  className = '', 
  variant = 'default', // default, striped, bordered, colorful
  hoverable = true,
  ...props 
}, ref) => {
  const variantClasses = {
    default: '',
    striped: 'table-striped',
    bordered: 'table-bordered',
    colorful: 'table-colorful',
  };

  return (
    <div className="relative w-full overflow-auto rounded-lg shadow-[var(--shadow-md)]">
      <table
        ref={ref}
        className={`w-full caption-bottom text-sm border-collapse ${hoverable ? 'table-hoverable' : ''} ${variantClasses[variant]} ${className}`}
        {...props}
      />
    </div>
  );
});

Table.displayName = 'Table';

/**
 * TableHeader component
 */
const TableHeader = React.forwardRef(({ className = '', sticky = false, ...props }, ref) => {
  return (
    <thead 
      ref={ref} 
      className={`bg-[var(--header-bg)] text-[var(--text-primary)] ${sticky ? 'sticky top-0 z-10' : ''} ${className}`} 
      {...props} 
    />
  );
});

TableHeader.displayName = 'TableHeader';

/**
 * TableBody component
 */
const TableBody = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <tbody ref={ref} className={`${className}`} {...props} />
  );
});

TableBody.displayName = 'TableBody';

/**
 * TableRow component
 */
const TableRow = React.forwardRef(({ 
  className = '', 
  active = false,
  highlight = false,
  status = null, // success, warning, error, info
  ...props 
}, ref) => {
  // Status-based styling
  const statusClasses = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900',
    primary: 'bg-[var(--color-primary-light)]/10 border-[var(--color-primary-light)]/30',
  };

  const activeClass = active ? 'bg-[var(--input-bg)] font-medium' : '';
  const highlightClass = highlight ? 'bg-[var(--color-primary)]/5 dark:bg-[var(--color-primary)]/10' : '';
  const statusClass = status ? statusClasses[status] : '';

  return (
    <tr
      ref={ref}
      className={`border-b border-[var(--color-border)] transition-all hover:bg-[var(--input-bg)] data-[state=selected]:bg-[var(--input-bg)] ${activeClass} ${highlightClass} ${statusClass} ${className}`}
      {...props}
    />
  );
});

TableRow.displayName = 'TableRow';

/**
 * TableHead component
 */
const TableHead = React.forwardRef(({ 
  className = '', 
  sorted = null, // asc, desc, or null
  ...props 
}, ref) => {
  const sortedClass = sorted === 'asc' 
    ? 'after:content-["↑"] after:ml-1 text-[var(--color-primary)]' 
    : sorted === 'desc' 
      ? 'after:content-["↓"] after:ml-1 text-[var(--color-primary)]' 
      : '';

  return (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-medium text-[var(--text-primary)] [&:has([role=checkbox])]:pr-0 ${sortedClass} ${className}`}
      {...props}
    />
  );
});

TableHead.displayName = 'TableHead';

/**
 * TableCell component
 */
const TableCell = React.forwardRef(({ 
  className = '', 
  highlight = false,
  truncate = false,
  ...props 
}, ref) => {
  const highlightClass = highlight ? 'bg-[var(--color-primary)]/5 font-medium' : '';
  const truncateClass = truncate ? 'truncate max-w-[200px]' : '';

  return (
    <td
      ref={ref}
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${highlightClass} ${truncateClass} ${className}`}
      {...props}
    />
  );
});

TableCell.displayName = 'TableCell';

/**
 * TableCaption component
 */
const TableCaption = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <caption
      ref={ref}
      className={`mt-4 text-sm text-[var(--text-secondary)] ${className}`}
      {...props}
    />
  );
});

TableCaption.displayName = 'TableCaption';

// Add CSS styles for the variants
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .table-striped tbody tr:nth-child(odd) {
      background-color: var(--input-bg);
    }
    
    .table-bordered th,
    .table-bordered td {
      border: 1px solid var(--color-border);
    }
    
    .table-hoverable tbody tr {
      transition: all 0.2s ease;
    }
    
    .table-hoverable tbody tr:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    
    .table-colorful th {
      background: linear-gradient(to right, var(--color-primary-light), var(--color-primary));
      color: white;
    }
    
    .table-colorful tbody tr:hover {
      background-color: var(--color-primary-light);
      background-opacity: 0.1;
    }
  `;
  document.head.appendChild(style);
}

// PropTypes
const commonPropTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

Table.propTypes = {
  ...commonPropTypes,
  variant: PropTypes.oneOf(['default', 'striped', 'bordered', 'colorful']),
  hoverable: PropTypes.bool,
};

TableHeader.propTypes = {
  ...commonPropTypes,
  sticky: PropTypes.bool,
};

TableBody.propTypes = commonPropTypes;

TableRow.propTypes = {
  ...commonPropTypes,
  active: PropTypes.bool,
  highlight: PropTypes.bool,
  status: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'primary', null]),
};

TableHead.propTypes = {
  ...commonPropTypes,
  sorted: PropTypes.oneOf(['asc', 'desc', null]),
};

TableCell.propTypes = {
  ...commonPropTypes,
  highlight: PropTypes.bool,
  truncate: PropTypes.bool,
};

TableCaption.propTypes = commonPropTypes;

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}; 