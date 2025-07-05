import React from 'react';
import { cn } from '../../lib/utils';

const Table = ({ children, className, ...props }) => (
  <div className='w-full overflow-x-auto'>
    <table
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    >
      {children}
    </table>
  </div>
);

const THead = ({ children, className, ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props}>
    {children}
  </thead>
);

const TBody = ({ children, className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
    {children}
  </tbody>
);

const TR = ({ children, className, ...props }) => (
  <tr
    className={cn('border-b transition-colors hover:bg-muted/50', className)}
    {...props}
  >
    {children}
  </tr>
);

const TH = ({ children, className, ...props }) => (
  <th
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
      className
    )}
    {...props}
  >
    {children}
  </th>
);

const TD = ({ children, className, ...props }) => (
  <td className={cn('p-4 align-middle', className)} {...props}>
    {children}
  </td>
);

export { Table, THead, TBody, TR, TH, TD };
