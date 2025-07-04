import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import './AddressAutocomplete.css';

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
      iconElement.className = 'address-icon-container';
      iconElement.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
      containerRef.current.appendChild(iconElement);

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
      <div className='address-autocomplete-wrapper'>
        <MapPin className='address-icon' size={18} />
        <input
          type='text'
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'Enter an address'}
          className={`address-input ${className || ''}`}
          disabled={disabled}
        />
      </div>
    );
  }

  // Return the container for the PlaceAutocompleteElement
  return (
    <div className='address-autocomplete-wrapper'>
      <div
        ref={containerRef}
        className='place-autocomplete-container'
        data-value={value} // Store value as data attribute for debugging
      />
    </div>
  );
};

export default AddressAutocomplete;
