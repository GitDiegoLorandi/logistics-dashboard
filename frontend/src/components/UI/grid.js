import React from 'react';
import { cn } from '../../lib/utils';

export function Grid({
  children,
  className,
  columns = 'grid-cols-12',
  gap = 'gap-4',
  ...props
}) {
  return (
    <div className={cn('grid', columns, gap, className)} {...props}>
      {children}
    </div>
  );
}

export function GridItem({
  children,
  className,
  colSpan = 'col-span-12',
  rowSpan,
  ...props
}) {
  return (
    <div className={cn(colSpan, rowSpan, className)} {...props}>
      {children}
    </div>
  );
}
