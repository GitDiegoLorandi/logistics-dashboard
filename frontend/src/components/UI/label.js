import React from 'react';
import { cn } from '../../lib/utils';

const Label = ({ className, htmlFor, children, ...props }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};

export { Label };
