import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './button';

/**
 * Error message component for displaying errors with retry option
 */
const ErrorMessage = ({ 
  message = 'An error occurred. Please try again.',
  onRetry,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center ${className}`}
      {...props}
    >
      <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
      <h3 className="mb-2 text-lg font-semibold text-destructive">Error</h3>
      <p className="mb-4 text-sm text-destructive/80">{message}</p>
      
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  className: PropTypes.string,
};

export default ErrorMessage; 