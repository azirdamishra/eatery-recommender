import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Location, Landmark } from '../services/locationService';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

interface LocationMapProps {
  currentLocation?: Location;
  landmarks?: Landmark[];
  onMapClick?: (location: Location) => void;
  onMarkerClick?: (landmark: Landmark) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({
  currentLocation,
  landmarks = [],
  onMapClick,
  onMarkerClick
}) => {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && onMapClick) {
      onMapClick({
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng()
      });
    }
  };

  const handleMarkerClick = (landmark: Landmark) => {
    setSelectedLandmark(landmark);
    if (onMarkerClick) {
      onMarkerClick(landmark);
    }
  };

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  const mapCenter = currentLocation 
    ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
    : defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
    >
      {currentLocation && (
        <Marker
          position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }}
        />
      )}

      {landmarks.map((landmark) => (
        <Marker
          key={landmark.id}
          position={{ lat: landmark.latitude, lng: landmark.longitude }}
          onClick={() => handleMarkerClick(landmark)}
        />
      ))}

      {selectedLandmark && (
        <InfoWindow
          position={{ lat: selectedLandmark.latitude, lng: selectedLandmark.longitude }}
          onCloseClick={() => setSelectedLandmark(null)}
        >
          <div>
            <h3>{selectedLandmark.name}</h3>
            {selectedLandmark.description && <p>{selectedLandmark.description}</p>}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default LocationMap; 