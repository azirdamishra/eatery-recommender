import React, { useEffect, useRef } from 'react';
import { Location } from '../services/locationService';

interface PlacesAutocompleteProps {
  onPlaceSelected: (location: Location) => void;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({ onPlaceSelected }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    // Create the autocomplete instance with the new Places API
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry'],
      types: ['establishment', 'geocode']
    });
    autocompleteRef.current = autocomplete;

    // Add event listener for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        onPlaceSelected({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });
      }
    });

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelected]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a location"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
};

export default PlacesAutocomplete; 