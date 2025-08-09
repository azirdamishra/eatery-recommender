import React, { useState, useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_OPTIONS } from '../config/maps';
import { MapLocation } from '../types';

interface PlacesAutocompleteProps {
  onPlaceSelect: (location: MapLocation & { name: string; address: string }) => void;
  placeholder?: string;
  className?: string;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = "Search for a place...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_OPTIONS);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      // Initialize the autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'name', 'formatted_address', 'geometry.location']
      });

      // Add listener for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place && place.geometry && place.geometry.location) {
          const location = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            name: place.name || '',
            address: place.formatted_address || ''
          };
          
          onPlaceSelect(location);
          setInputValue(place.name || place.formatted_address || '');
        }
      });
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onPlaceSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClear = () => {
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <input
          type="text"
          placeholder="Loading search..."
          className="form-input pr-10 bg-gray-100"
          disabled
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="form-input pr-10"
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Clear button */}
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default PlacesAutocomplete;
