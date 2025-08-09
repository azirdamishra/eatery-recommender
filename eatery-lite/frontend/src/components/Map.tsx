import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Location, MapLocation } from '../types';
import { GOOGLE_MAPS_OPTIONS, MAP_CONFIG } from '../config/maps';

interface MapProps {
  locations: Location[];
  onMapClick?: (location: MapLocation) => void;
  onLocationClick?: (location: Location) => void;
  center?: MapLocation;
  searchLocation?: MapLocation & { name?: string; address?: string };
  currentLocation?: MapLocation;
}

const Map: React.FC<MapProps> = ({
  locations,
  onMapClick,
  onLocationClick,
  center,
  searchLocation,
  currentLocation
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_OPTIONS);

  // Determine map center priority: searchLocation > currentLocation > center > default
  const getMapCenter = () => {
    const priorityLocation = searchLocation || currentLocation || center;
    if (priorityLocation) {
      return { lat: priorityLocation.latitude, lng: priorityLocation.longitude };
    }
    return MAP_CONFIG.defaultCenter;
  };
  const mapCenter = getMapCenter();

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update map center when search location or current location changes
  useEffect(() => {
    if (map && (searchLocation || currentLocation)) {
      const newCenter = searchLocation || currentLocation;
      if (newCenter) {
        map.panTo({ lat: newCenter.latitude, lng: newCenter.longitude });
        
        // Zoom to a good level for the new location
        const currentZoom = map.getZoom() || 13;
        if (currentZoom < 14) {
          setTimeout(() => {
            map.setZoom(15);
          }, 300);
        }
      }
    }
  }, [map, searchLocation, currentLocation]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && onMapClick) {
      const clickedLocation = {
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng()
      };
      onMapClick(clickedLocation);
    }
  };

  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-[500px] bg-red-100 flex items-center justify-center rounded-lg">
        <p className="text-red-600">Error loading Google Maps: {loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <GoogleMap
        mapContainerStyle={MAP_CONFIG.containerStyle}
        center={mapCenter}
        zoom={MAP_CONFIG.defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Render location markers */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={{ lat: location.latitude, lng: location.longitude }}
            onClick={() => handleMarkerClick(location)}
            title={location.name}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 32),
            }}
          />
        ))}

        {/* Search location marker */}
        {searchLocation && (
          <Marker
            position={{ lat: searchLocation.latitude, lng: searchLocation.longitude }}
            title={`Search result: ${searchLocation.name || 'Selected location'}`}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40),
            }}
            onClick={() => {
              if (onMapClick) {
                onMapClick({
                  latitude: searchLocation.latitude,
                  longitude: searchLocation.longitude
                });
              }
            }}
          />
        )}

        {/* Current location marker */}
        {currentLocation && (
          <Marker
            position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
            title="Your current location"
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40),
            }}
            onClick={() => {
              if (onMapClick) {
                onMapClick({
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude
                });
              }
            }}
          />
        )}

        {/* Info window for selected location */}
        {selectedLocation && (
          <InfoWindow
            position={{ 
              lat: selectedLocation.latitude, 
              lng: selectedLocation.longitude 
            }}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <div className="p-3 max-w-xs">
              <h3 className="font-semibold text-lg text-gray-800 mb-1">
                {selectedLocation.name}
              </h3>
              {selectedLocation.description && (
                <p className="text-gray-600 text-sm mb-2">
                  {selectedLocation.description}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Added by: {selectedLocation.addedBy}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(selectedLocation.createdAt).toLocaleDateString()}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default Map;
