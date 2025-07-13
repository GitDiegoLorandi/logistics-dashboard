import React from 'react';
import PropTypes from 'prop-types';

/**
 * Table component
 */
const Table = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={`w-full caption-bottom text-sm ${className}`}
        {...props}
      />
    </div>
  );
});

Table.displayName = 'Table';

/**
 * TableHeader component
 */
const TableHeader = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <thead ref={ref} className={`${className}`} {...props} />
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
const TableRow = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}
      {...props}
    />
  );
});

TableRow.displayName = 'TableRow';

/**
 * TableHead component
 */
const TableHead = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  );
});

TableHead.displayName = 'TableHead';

/**
 * TableCell component
 */
const TableCell = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <td
      ref={ref}
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
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
      className={`mt-4 text-sm text-muted-foreground ${className}`}
      {...props}
    />
  );
});

TableCaption.displayName = 'TableCaption';

// PropTypes
const commonPropTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

Table.propTypes = commonPropTypes;
TableHeader.propTypes = commonPropTypes;
TableBody.propTypes = commonPropTypes;
TableRow.propTypes = commonPropTypes;
TableHead.propTypes = commonPropTypes;
TableCell.propTypes = commonPropTypes;
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