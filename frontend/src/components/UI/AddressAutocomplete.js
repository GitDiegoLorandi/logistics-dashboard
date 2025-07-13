import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

const AddressAutocomplete = ({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useNativeInput, setUseNativeInput] = useState(true);

  useEffect(() => {
    // Skip if component is disabled
    if (disabled) return;

    // Check if Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }

    // Check if PlaceAutocompleteElement is available
    if (
      !window.google.maps.places ||
      !window.google.maps.places.PlaceAutocompleteElement
    ) {
      console.warn(
        'Google Maps Places API PlaceAutocompleteElement not available, using fallback'
      );
      return;
    }

    // Only initialize once
    if (!useNativeInput) return;

    try {
      // Wait for the container to be available in the DOM
      if (!containerRef.current) return;

      // Clear any existing content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      // Create the PlaceAutocompleteElement
      const placeAutocompleteElement =
        new window.google.maps.places.PlaceAutocompleteElement({
          types: ['address'],
          componentRestrictions: { country: ['us', 'br'] }, // Include both US and Brazil
        });

      // Add event listener for place selection
      placeAutocompleteElement.addEventListener('place_changed', event => {
        const place = event.detail.place;
        if (place && place.formattedAddress) {
          onChange(place.formattedAddress);
        }
      });

      // Append the element to our container
      containerRef.current.appendChild(placeAutocompleteElement);

      // Add the MapPin icon
      const iconElement = document.createElement('div');
      iconElement.className =
        'absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none';
      iconElement.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
      containerRef.current.appendChild(iconElement);

      // Apply Tailwind-compatible styling to the Google element
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        gmpx-place-autocomplete {
          width: 100%;
          --gmpx-font-family: inherit;
          --gmpx-color-surface: white;
          --gmpx-color-on-surface: #1f2937;
          --gmpx-color-on-surface-variant: #4b5563;
          --gmpx-color-primary: hsl(var(--primary));
          --gmpx-border-radius: 0.5rem;
          --gmpx-border-width: 1px;
          --gmpx-border-color: hsl(var(--border));
          --gmpx-hover-border-color: hsl(var(--muted-foreground));
          --gmpx-focus-border-color: hsl(var(--primary));
          --gmpx-focus-outline-color: hsl(var(--ring) / 0.1);
          --gmpx-input-text-size: 0.875rem;
          --gmpx-input-text-line-height: 1.5;
          --gmpx-input-text-padding: 0.75rem 0.75rem 0.75rem 2.5rem;
        }
      `;
      document.head.appendChild(styleElement);

      setUseNativeInput(false);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error initializing PlaceAutocompleteElement:', error);
      // Fall back to native input on error
      setUseNativeInput(true);
      setIsLoaded(true);
    }
  }, [onChange, disabled, useNativeInput]);

  // If using native input (fallback or initial state)
  if (useNativeInput) {
    return (
      <div className='relative w-full'>
        <MapPin
          className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none'
          size={18}
        />
        <input
          type='text'
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'Enter an address'}
          className={cn(
            'w-full py-3 pl-10 pr-3 border border-input rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed h-11',
            className
          )}
          disabled={disabled}
        />
      </div>
    );
  }

  // Return the container for the PlaceAutocompleteElement
  return (
    <div className='relative w-full'>
      <div
        ref={containerRef}
        className='relative w-full min-h-[44px]'
        data-value={value} // Store value as data attribute for debugging
      />
    </div>
  );
};

export default AddressAutocomplete;
