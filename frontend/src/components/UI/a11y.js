import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * VisuallyHidden component for screen reader only content
 * Makes content available to screen readers but invisible visually
 */
export const VisuallyHidden = ({ children, as: Component = 'span', ...props }) => {
  return (
    <Component
      {...props}
      style={{
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        width: '1px',
        whiteSpace: 'nowrap',
        wordWrap: 'normal',
      }}
    >
      {children}
    </Component>
  );
};

/**
 * LiveRegion component for announcing content to screen readers
 * Use for dynamic content that needs to be announced to screen reader users
 */
export const LiveRegion = ({ children, assertive = false }) => {
  const [announcement, setAnnouncement] = useState('');
  
  // Update announcement when children change
  useEffect(() => {
    if (children) {
      setAnnouncement(typeof children === 'string' ? children : '');
      
      // Clear announcement after 3 seconds to prevent repeated announcements
      const timerId = setTimeout(() => {
        setAnnouncement('');
      }, 3000);
      
      return () => clearTimeout(timerId);
    }
  }, [children]);
  
  return (
    <div
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

/**
 * FocusTrap component to trap focus within an element
 * Useful for modals, dialogs, and other focused UI components
 */
export const FocusTrap = ({ children, active = true }) => {
  const rootRef = useRef(null);
  
  useEffect(() => {
    if (!active) return;
    
    const root = rootRef.current;
    if (!root) return;
    
    // Find all focusable elements
    const focusableElements = root.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      // Shift + Tab => backward
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } 
      // Tab => forward
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    // Focus first element when trap is activated
    firstElement.focus();
    
    // Add event listener
    root.addEventListener('keydown', handleKeyDown);
    
    return () => {
      root.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);
  
  return (
    <div ref={rootRef}>
      {children}
    </div>
  );
};

/**
 * SkipLink component for keyboard navigation
 * Allows keyboard users to skip directly to main content
 */
export const SkipLink = ({ targetId = 'main', children = 'Skip to main content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="fixed top-0 left-0 p-2 bg-[var(--color-primary)] text-white translate-y-[-100%] focus:translate-y-0 transition-transform z-50"
    >
      {children}
    </a>
  );
};

VisuallyHidden.propTypes = {
  children: PropTypes.node,
  as: PropTypes.elementType,
};

LiveRegion.propTypes = {
  children: PropTypes.node,
  assertive: PropTypes.bool,
};

FocusTrap.propTypes = {
  children: PropTypes.node,
  active: PropTypes.bool,
};

SkipLink.propTypes = {
  targetId: PropTypes.string,
  children: PropTypes.node,
}; 