import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

const Dialog = ({ open, onClose, children, className }) => {
  useEffect(() => {
    if (!open) return;

    const handleKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-lg bg-card shadow-lg animate-in fade-in zoom-in-95',
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export { Dialog };
