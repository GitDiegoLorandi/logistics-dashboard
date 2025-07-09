/**
 * Accessibility utilities for enhancing component accessibility
 */

/**
 * Creates an ID that is unique for a given component instance
 * 
 * @param {string} prefix - Prefix for the ID
 * @returns {string} - Unique ID
 */
export const useUniqueId = (prefix = 'id') => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generates appropriate ARIA attributes for form fields
 * 
 * @param {Object} options - Options for generating ARIA attributes
 * @param {string} options.id - ID of the form field
 * @param {boolean} options.required - Whether the field is required
 * @param {boolean} options.invalid - Whether the field is invalid
 * @param {string} options.errorMessage - Error message for the field
 * @param {string} options.description - Description of the field
 * @returns {Object} - ARIA attributes
 */
export const getFieldA11yProps = ({ 
  id, 
  required = false, 
  invalid = false, 
  errorMessage = '', 
  description = '' 
}) => {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = invalid && errorMessage ? `${id}-error` : undefined;
  
  const ariaProps = {
    id,
    'aria-required': required,
    'aria-invalid': invalid,
  };
  
  if (descriptionId || errorId) {
    ariaProps['aria-describedby'] = [
      descriptionId,
      errorId
    ].filter(Boolean).join(' ');
  }
  
  return {
    inputProps: ariaProps,
    descriptionId,
    errorId
  };
};

/**
 * Adds keyboard navigation support to a component
 * 
 * @param {Object} options - Options for keyboard navigation
 * @param {Function} options.onKeyDown - Callback for keydown event
 * @param {boolean} options.enableArrows - Whether to enable arrow key navigation
 * @param {boolean} options.enableHomeEnd - Whether to enable Home/End navigation
 * @param {boolean} options.enablePageUpDown - Whether to enable Page Up/Down navigation
 * @param {boolean} options.enableEscapeKey - Whether to enable Escape key
 * @param {boolean} options.enableEnterKey - Whether to enable Enter key
 * @param {boolean} options.enableTabKey - Whether to enable Tab key handling
 * @returns {Function} - Event handler for keydown events
 */
export const createKeyboardHandler = ({
  onKeyDown,
  enableArrows = true,
  enableHomeEnd = true,
  enablePageUpDown = false,
  enableEscapeKey = true,
  enableEnterKey = true,
  enableTabKey = false,
}) => {
  return (event) => {
    // Call the original handler if provided
    if (onKeyDown) {
      onKeyDown(event);
      
      // If the original handler called preventDefault(), respect that
      if (event.defaultPrevented) {
        return;
      }
    }
    
    const { key } = event;
    
    // Handle arrow keys
    if (enableArrows && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      // Implementation depends on the component
      return;
    }
    
    // Handle Home/End keys
    if (enableHomeEnd && ['Home', 'End'].includes(key)) {
      // Implementation depends on the component
      return;
    }
    
    // Handle Page Up/Down keys
    if (enablePageUpDown && ['PageUp', 'PageDown'].includes(key)) {
      // Implementation depends on the component
      return;
    }
    
    // Handle Escape key
    if (enableEscapeKey && key === 'Escape') {
      // Implementation depends on the component
      return;
    }
    
    // Handle Enter key
    if (enableEnterKey && key === 'Enter') {
      // Implementation depends on the component
      return;
    }
    
    // Handle Tab key
    if (enableTabKey && key === 'Tab') {
      // Implementation depends on the component
      return;
    }
  };
};

/**
 * Creates a focus trap within a container
 * 
 * @param {Object} options - Options for the focus trap
 * @param {string|HTMLElement} options.container - Container element or selector
 * @param {boolean} options.autoFocus - Whether to automatically focus the first focusable element
 * @param {Function} options.onEscape - Callback for when Escape key is pressed
 * @returns {Object} - Focus trap methods
 */
export const createFocusTrap = ({
  container,
  autoFocus = true,
  onEscape = () => {},
}) => {
  let focusableElements = [];
  let previouslyFocusedElement = null;
  
  const getContainer = () => {
    return typeof container === 'string'
      ? document.querySelector(container)
      : container;
  };
  
  const getFocusableElements = () => {
    const containerElement = getContainer();
    if (!containerElement) return [];
    
    return Array.from(
      containerElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  };
  
  const activate = () => {
    previouslyFocusedElement = document.activeElement;
    focusableElements = getFocusableElements();
    
    if (autoFocus && focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    
    document.addEventListener('keydown', handleKeyDown);
  };
  
  const deactivate = () => {
    document.removeEventListener('keydown', handleKeyDown);
    
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  };
  
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onEscape();
      return;
    }
    
    if (event.key !== 'Tab' || focusableElements.length <= 1) {
      return;
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  };
  
  return {
    activate,
    deactivate,
    update: () => {
      focusableElements = getFocusableElements();
    }
  };
};

/**
 * Announces a message to screen readers
 * 
 * @param {string} message - Message to announce
 * @param {string} politeness - Politeness level ('polite' or 'assertive')
 */
export const announceToScreenReader = (message, politeness = 'polite') => {
  const announcer = document.getElementById('a11y-announcer');
  let announcerElement = announcer;
  
  if (!announcerElement) {
    announcerElement = document.createElement('div');
    announcerElement.id = 'a11y-announcer';
    announcerElement.setAttribute('aria-live', politeness);
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.style.position = 'absolute';
    announcerElement.style.width = '1px';
    announcerElement.style.height = '1px';
    announcerElement.style.padding = '0';
    announcerElement.style.overflow = 'hidden';
    announcerElement.style.clip = 'rect(0, 0, 0, 0)';
    announcerElement.style.whiteSpace = 'nowrap';
    announcerElement.style.border = '0';
    document.body.appendChild(announcerElement);
  }
  
  // Clear the announcer
  announcerElement.textContent = '';
  
  // Trigger browser to recognize the change
  setTimeout(() => {
    announcerElement.textContent = message;
  }, 50);
};

/**
 * Checks if reduced motion is preferred by the user
 * 
 * @returns {boolean} - Whether reduced motion is preferred
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}; 