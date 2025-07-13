import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Dialog component for modals
 */
const Dialog = ({ 
  isOpen = undefined, 
  open = undefined, 
  onClose = undefined, 
  onOpenChange = undefined, 
  title, 
  children, 
  className = '' 
} = {}) => {
  // Support both isOpen and open props
  const isDialogOpen = isOpen !== undefined ? isOpen : open;
  
  // Support both onClose and onOpenChange props
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isDialogOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scrolling when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore body scrolling when dialog is closed
      document.body.style.overflow = 'auto';
    };
  }, [isDialogOpen]);

  // If dialog is not open, don't render anything
  if (!isDialogOpen) return null;

  // Handle backdrop click to close dialog
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`max-h-[85vh] w-full max-w-md overflow-auto rounded-lg bg-background shadow-lg ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={handleClose}
              className="rounded-full p-1 transition-colors hover:bg-gray-200"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

Dialog.propTypes = {
  isOpen: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onOpenChange: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export { Dialog }; 