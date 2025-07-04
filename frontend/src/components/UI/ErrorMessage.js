import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import './ErrorMessage.css';

const ErrorMessage = ({
  message = 'Something went wrong',
  onRetry,
  showRetry = true,
}) => {
  return (
    <div className='error-message-container'>
      <div className='error-content'>
        <AlertCircle size={48} className='error-icon' />
        <h3 className='error-title'>Oops! Something went wrong</h3>
        <p className='error-description'>{message}</p>
        {showRetry && onRetry && (
          <button className='retry-button' onClick={onRetry}>
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
