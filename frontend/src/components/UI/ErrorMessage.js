import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

const ErrorMessage = ({
  message = 'Something went wrong',
  onRetry,
  showRetry = true,
}) => {
  return (
    <div className='flex items-center justify-center p-8 min-h-[200px]'>
      <div className='text-center max-w-md'>
        <AlertCircle size={48} className='mx-auto mb-4 text-destructive' />
        <h3 className='text-xl font-semibold text-foreground mb-2'>
          Oops! Something went wrong
        </h3>
        <p className='text-sm text-muted-foreground mb-6'>{message}</p>
        {showRetry && onRetry && (
          <Button onClick={onRetry} className='inline-flex items-center gap-2'>
            <RefreshCw size={16} />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
