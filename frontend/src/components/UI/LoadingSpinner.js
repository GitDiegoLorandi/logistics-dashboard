import React from 'react';
import { cn } from '../../lib/utils';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const spinnerSizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  };

  return (
    <div className='flex flex-col items-center justify-center p-8 min-h-[200px]'>
      <div className='relative'>
        <div
          className={cn(
            'rounded-full border-t-primary border-muted animate-spin',
            spinnerSizeClasses[size]
          )}
        />
      </div>
      {message && (
        <p className='mt-4 text-sm text-muted-foreground text-center'>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
