import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Input } from './input';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * Address autocomplete component with Google Places API integration
 */
const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter an address',
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  ...props
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    // Check if Google Maps API is loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
    } else {
      // For this component to work, you need to include the Google Maps API script in index.html
      // with the Places library enabled
      console.warn('Google Maps API not loaded. Address autocomplete will not work.');
    }

    function initAutocomplete() {
      if (inputRef.current && !autocompleteRef.current) {
        const options = {
          componentRestrictions: { country: 'us' }, // Restrict to a specific country if needed
          fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        };

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          options
        );

        autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      }
    }

    return () => {
      // Clean up listener if component unmounts
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle place selection from Google Places Autocomplete
  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place && place.formatted_address) {
        if (onChange) {
          onChange(place.formatted_address);
        }
        
        if (onSelect) {
          onSelect(place);
        }
        
        setSuggestions([]);
      }
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    
    if (onChange) {
      onChange(newValue);
    }
    
    if (newValue.length > 2) {
      setLoading(true);
      // The actual suggestions will come from Google Places API
      // This is just for the UI state
      setTimeout(() => {
        setLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`} {...props}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pl-10 ${inputClassName}`}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown - will be populated by Google Places API */}
      {focused && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="cursor-pointer px-4 py-2 hover:bg-muted"
              onClick={() => {
                if (onChange) onChange(suggestion);
                setSuggestions([]);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

AddressAutocomplete.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSelect: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
};

export default AddressAutocomplete; 