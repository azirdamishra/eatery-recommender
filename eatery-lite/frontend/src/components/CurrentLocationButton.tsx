import React, { useState } from 'react';
import { MapLocation } from '../types';

interface CurrentLocationButtonProps {
  onLocationFound: (location: MapLocation) => void;
  onError?: (error: string) => void;
  className?: string;
}

const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onLocationFound,
  onError,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser';
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: MapLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        onLocationFound(location);
        setIsLoading(false);
      },
      (error) => {
        let errorMsg = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }
        
        onError?.(errorMsg);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <button
      onClick={getCurrentLocation}
      disabled={isLoading}
      className={`flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      title="Use my current location"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Finding...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          My Location
        </>
      )}
    </button>
  );
};

export default CurrentLocationButton;
