import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Input } from './input';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

// Geoapify API key and project ID
const GEOAPIFY_API_KEY = '6d177e3213d4451d87c9e1561ee3b8d3';
const GEOAPIFY_PROJECT_ID = '7YuzBeC5u2hoonqNRzlS';

/**
 * Address autocomplete component with Geoapify API integration
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
  const [apiError, setApiError] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

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

  // Fetch address suggestions from Geoapify
  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) return;

    setLoading(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_API_KEY}&format=json&limit=5`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Geoapify API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.results) {
        const addressSuggestions = data.results.map(result => ({
          formattedAddress: result.formatted,
          lat: result.lat,
          lon: result.lon,
          country: result.country,
          state: result.state,
          city: result.city,
          street: result.street,
          houseNumber: result.housenumber,
          postcode: result.postcode,
          raw: result
        }));
        
        setSuggestions(addressSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setApiError(true);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    if (onChange) {
      onChange(suggestion.formattedAddress);
    }
    
    if (onSelect) {
      onSelect(suggestion);
    }
    
    setSuggestions([]);
  };

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    
    if (onChange) {
      onChange(newValue);
    }
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (newValue.length >= 3) {
      setLoading(true);
      // Debounce API calls to avoid too many requests
      debounceTimerRef.current = setTimeout(() => {
        fetchAddressSuggestions(newValue);
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
          placeholder={apiError ? "Enter address manually" : placeholder}
          className={`pl-10 ${inputClassName}`}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : apiError ? (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* API error message */}
      {apiError && (
        <div className="mt-1 text-xs text-amber-500">
          Address autocomplete unavailable. Please enter address manually.
        </div>
      )}

      {/* Suggestions dropdown */}
      {focused && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="cursor-pointer px-4 py-2 hover:bg-muted"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="font-medium">{suggestion.formattedAddress}</div>
              {suggestion.city && suggestion.country && (
                <div className="text-xs text-muted-foreground">
                  {[suggestion.city, suggestion.state, suggestion.country]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              )}
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