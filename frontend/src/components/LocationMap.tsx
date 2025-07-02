import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Location, Landmark, UserLocation } from '../services/locationService';
import { GOOGLE_MAPS_OPTIONS } from '../config/maps';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

// Google's standard red marker (for selected/search locations)
const googleRedMarker = {
  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  scaledSize: new google.maps.Size(32, 32),
  anchor: new google.maps.Point(16, 32),
};

// Backup approaches
const simpleRedCircle = {
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: '#FF0000',
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 3,
  scale: 15,
};

// Default red marker URL
const defaultRedMarker = {
  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
};

// Red marker for landmarks (changed from green circles to red pointers)
const landmarkIcon = {
  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  scaledSize: new google.maps.Size(32, 32),
  anchor: new google.maps.Point(16, 32),
};

// Blue marker for pinned locations
const pinnedLocationIcon = {
  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  scaledSize: new google.maps.Size(32, 32),
  anchor: new google.maps.Point(16, 32),
};

interface LocationMapProps {
  currentLocation?: UserLocation;
  landmarks: Landmark[];
  pinnedLocations?: Array<Location & { id: string; name: string }>;
  onMapClick?: (location: Location) => void;
  onMarkerClick?: (landmark: Landmark) => void;
  onPinnedLocationClick?: (pinnedLocation: Location & { id: string; name: string }) => void;
  searchLocation?: Location | null;
}

const LocationMap: React.FC<LocationMapProps> = ({
  currentLocation,
  landmarks,
  pinnedLocations = [],
  onMapClick,
  onMarkerClick,
  onPinnedLocationClick,
  searchLocation
}) => {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [showSearchLocationInfo, setShowSearchLocationInfo] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_OPTIONS);

  // EXTENSIVE DEBUG - Check everything
  useEffect(() => {
    console.log('🔍 LOCATIONMAP DEBUG FULL STATE:');
    console.log('  - isLoaded:', isLoaded);
    console.log('  - loadError:', loadError);
    console.log('  - searchLocation:', searchLocation);
    console.log('  - landmarks array:', landmarks);
    console.log('  - landmarks length:', landmarks?.length || 0);
    console.log('  - pinnedLocations array:', pinnedLocations);
    console.log('  - pinnedLocations length:', pinnedLocations?.length || 0);
    console.log('  - google object:', typeof window.google, window.google);
    console.log('  - google.maps:', typeof window.google?.maps, window.google?.maps);
    console.log('  - google.maps.SymbolPath:', window.google?.maps?.SymbolPath);
    
    if (searchLocation) {
      console.log('🚨 SEARCH LOCATION EXISTS:', searchLocation);
      console.log('🚨 Will render search marker at:', searchLocation.latitude, searchLocation.longitude);
    } else {
      console.log('❌ NO searchLocation - no search marker will show');
    }
    
    if (landmarks && landmarks.length > 0) {
      console.log('🟢 LANDMARKS TO RENDER:', landmarks.length);
      landmarks.forEach((landmark, index) => {
        console.log(`  ${index + 1}. "${landmark.name}" at (${landmark.latitude}, ${landmark.longitude}) - ID: ${landmark.id}`);
      });
    } else {
      console.log('❌ NO LANDMARKS to render - array is:', landmarks);
    }

    if (pinnedLocations && pinnedLocations.length > 0) {
      console.log('🔵 PINNED LOCATIONS TO RENDER:', pinnedLocations.length);
      pinnedLocations.forEach((pinnedLocation, index) => {
        console.log(`  ${index + 1}. "${pinnedLocation.name}" at (${pinnedLocation.latitude}, ${pinnedLocation.longitude}) - ID: ${pinnedLocation.id}`);
      });
    } else {
      console.log('❌ NO PINNED LOCATIONS to render - array is:', pinnedLocations);
    }
  }, [isLoaded, loadError, searchLocation, landmarks, pinnedLocations]);

  // Create native landmarks fallback when React markers fail
  const createNativeLandmarkMarkers = useCallback(() => {
    if (!map || !landmarks || landmarks.length === 0) return;
    
    console.log('🟢 CREATING NATIVE LANDMARK MARKERS as fallback');
    
    landmarks.forEach((landmark) => {
      try {
        const nativeMarker = new google.maps.Marker({
          position: { lat: landmark.latitude, lng: landmark.longitude },
          map: map,
          title: `🟢 NATIVE: ${landmark.name}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });
        
        nativeMarker.addListener('click', () => {
          console.log('🟢 NATIVE LANDMARK CLICKED:', landmark.name);
          if (onMarkerClick) {
            onMarkerClick(landmark);
          }
        });
        
        console.log('✅ NATIVE LANDMARK MARKER CREATED:', landmark.name);
      } catch (error) {
        console.error('❌ FAILED TO CREATE NATIVE MARKER:', landmark.name, error);
      }
    });
  }, [map, landmarks, onMarkerClick]);

  // Force re-render when landmarks change
  useEffect(() => {
    if (map && landmarks && landmarks.length > 0) {
      console.log('🔄 LANDMARKS CHANGED - Forcing map update');
      console.log('🔄 Current landmarks:', landmarks.map(l => ({ id: l.id, name: l.name })));
      
      // Small delay to ensure markers are created
      setTimeout(() => {
        console.log('🔄 Checking if markers are actually on the map...');
        try {
          const mapDiv = map.getDiv();
          const reactMarkers = mapDiv.querySelectorAll('[title*="📍"]');
          const nativeMarkers = mapDiv.querySelectorAll('[title*="NATIVE:"]');
          
          console.log('🔄 Found React markers in DOM:', reactMarkers.length);
          console.log('🔄 Found Native markers in DOM:', nativeMarkers.length);
          
          // If no React markers found and no native markers, create native fallback
          if (reactMarkers.length === 0 && nativeMarkers.length === 0) {
            console.log('🚨 NO LANDMARK MARKERS FOUND - Creating native fallback markers');
            createNativeLandmarkMarkers();
          } else if (reactMarkers.length > 0) {
            console.log('✅ React markers found, no fallback needed');
          } else if (nativeMarkers.length > 0) {
            console.log('✅ Native fallback markers already exist');
          }
          
          // Force a map refresh anyway
          const currentZoom = map.getZoom();
          if (currentZoom !== undefined) {
            map.setZoom(currentZoom); // This forces a re-render
          }
        } catch (e) {
          console.log('🔄 Could not check markers:', e);
          // Fallback: create native markers anyway
          createNativeLandmarkMarkers();
        }
      }, 1000); // Increased delay to 1 second
    }
  }, [landmarks, map, createNativeLandmarkMarkers]);

  // Update map center when current location changes
  useEffect(() => {
    if (searchLocation) {
      // Prioritize search location for map center
      const newCenter = { 
        lat: searchLocation.latitude, 
        lng: searchLocation.longitude 
      };
      console.log('📍 Setting map center to searchLocation:', newCenter);
      setMapCenter(newCenter);
      
      // FORCE map to center and zoom if it's already loaded
      if (map) {
        console.log('🗺️ FORCING map center and zoom to:', newCenter);
        map.setCenter(newCenter);
        map.setZoom(15); // Higher zoom to see the area better
      }
    } else if (currentLocation) {
      const newCenter = { 
        lat: currentLocation.latitude, 
        lng: currentLocation.longitude 
      };
      console.log('📍 Setting map center to currentLocation:', newCenter);
      setMapCenter(newCenter);
      
      // FORCE map to center and zoom if it's already loaded
      if (map) {
        console.log('🗺️ FORCING map center and zoom to:', newCenter);
        map.setCenter(newCenter);
        map.setZoom(15);
      }
    }
  }, [currentLocation, searchLocation, map]);

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('🗺️ MAP LOADED SUCCESSFULLY:', map);
    console.log('🗺️ Map center:', map.getCenter()?.toJSON());
    console.log('🗺️ Map zoom:', map.getZoom());
    setMap(map);
    
    // Debug: Check what's actually on the map after a delay
    setTimeout(() => {
      console.log('🔍 MAP DEBUG - Checking actual map state after 2 seconds:');
      console.log('  - Map center now:', map.getCenter()?.toJSON());
      console.log('  - Map zoom now:', map.getZoom());
      console.log('  - Map bounds:', map.getBounds()?.toJSON());
      
      // Try to access map markers (this might not work but worth trying)
      try {
        console.log('  - Map div:', map.getDiv());
        const markers = map.getDiv().querySelectorAll('[title*="MARKER"]');
        console.log('  - Found markers on page:', markers.length, markers);
        
        // EMERGENCY: Create a native Google Maps marker if no React markers are visible
        if (markers.length === 0 && searchLocation) {
          console.log('🚨 EMERGENCY: Creating native Google Maps marker as fallback!');
          const nativeMarker = new google.maps.Marker({
            position: { lat: searchLocation.latitude, lng: searchLocation.longitude },
            map: map,
            title: '🚨 NATIVE EMERGENCY MARKER',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            }
          });
          
          nativeMarker.addListener('click', () => {
            console.log('🚨 NATIVE MARKER CLICKED!');
            setShowSearchLocationInfo(true);
          });
          
          console.log('✅ NATIVE MARKER CREATED:', nativeMarker);
        }
      } catch (e) {
        console.log('  - Could not check for markers:', e);
      }
    }, 2000);
  }, [searchLocation, setShowSearchLocationInfo]);

  const onUnmount = useCallback(() => {
    console.log('🗺️ MAP UNMOUNTED');
    setMap(null);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && onMapClick) {
      const clickedLocation = {
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng()
      };
      console.log('🗺️ MAP CLICKED at:', clickedLocation);
      onMapClick(clickedLocation);
    }
  };

  const handleMarkerClick = (landmark: Landmark) => {
    console.log('🟢 LANDMARK MARKER CLICKED:', landmark.name);
    setSelectedLandmark(landmark);
    if (onMarkerClick) {
      onMarkerClick(landmark);
    }
  };

  // Check for load errors
  if (loadError) {
    console.error('❌ GOOGLE MAPS LOAD ERROR:', loadError);
    return <div className="w-full h-[400px] bg-red-100 flex items-center justify-center">
      <p className="text-red-500">Error loading Google Maps: {loadError.message}</p>
    </div>;
  }

  if (!isLoaded) {
    console.log('⏳ Google Maps is still loading...');
    return <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>;
  }

  console.log('🎯 ABOUT TO RENDER GOOGLE MAP with center:', mapCenter);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
    >
      {/* RED MARKER - SINGLE MARKER AT EXACT LOCATION */}
      {searchLocation && (() => {
        console.log('🚨 RENDERING SINGLE RED MARKER for searchLocation:', searchLocation);
        
        try {
          const position = { lat: searchLocation.latitude, lng: searchLocation.longitude };
          console.log('🚨 Marker position object:', position);
          
          return (
            <Marker
              position={position}
              title="🚨 SEARCH LOCATION MARKER"
              onClick={() => {
                console.log('🚨 SEARCH MARKER CLICKED!');
                setShowSearchLocationInfo(true);
              }}
              onLoad={() => console.log('✅ SEARCH MARKER LOADED')}
            />
          );
        } catch (error) {
          console.error('❌ ERROR CREATING RED MARKER:', error);
          return null;
        }
      })()}

      {/* LANDMARK MARKERS WITH ENHANCED ERROR HANDLING */}
      {landmarks && landmarks.length > 0 && landmarks.map((landmark) => {
        console.log('🟢 RENDERING LANDMARK:', landmark.name, `(${landmark.latitude}, ${landmark.longitude})`);
        
        // Validate landmark data
        if (!landmark || !landmark.id || typeof landmark.latitude !== 'number' || typeof landmark.longitude !== 'number') {
          console.error('❌ INVALID LANDMARK DATA:', landmark);
          return null;
        }
        
        try {
          const position = { lat: landmark.latitude, lng: landmark.longitude };
          console.log('🟢 Landmark position object:', position);
          
          return (
            <Marker
              key={`landmark-${landmark.id}`}
              position={position}
              onClick={() => handleMarkerClick(landmark)}
              icon={landmarkIcon}
              title={`📍 ${landmark.name}`}
              onLoad={() => console.log('✅ LANDMARK MARKER LOADED:', landmark.name)}
            />
          );
        } catch (error) {
          console.error('❌ ERROR CREATING LANDMARK MARKER:', landmark.name, error);
          
          // Fallback: Try to render a basic marker without custom icon
          try {
            return (
              <Marker
                key={`landmark-fallback-${landmark.id}`}
                position={{ lat: landmark.latitude, lng: landmark.longitude }}
                onClick={() => handleMarkerClick(landmark)}
                title={`📍 ${landmark.name} (fallback)`}
                onLoad={() => console.log('✅ FALLBACK LANDMARK MARKER LOADED:', landmark.name)}
              />
            );
          } catch (fallbackError) {
            console.error('❌ FALLBACK MARKER ALSO FAILED:', landmark.name, fallbackError);
            return null;
          }
        }
      })}

      {/* DEBUG: Show if no landmarks are being rendered */}
      {(!landmarks || landmarks.length === 0) && 
        (() => { 
          console.log('⚠️ NO LANDMARK MARKERS RENDERED - landmarks array:', landmarks);
          return null;
        })()
      }

      {/* PINNED LOCATION MARKERS WITH ENHANCED ERROR HANDLING */}
      {pinnedLocations && pinnedLocations.length > 0 && pinnedLocations.map((pinnedLocation) => {
        console.log('🔵 RENDERING PINNED LOCATION:', pinnedLocation.name, `(${pinnedLocation.latitude}, ${pinnedLocation.longitude})`);
        
        // Validate pinned location data
        if (!pinnedLocation || !pinnedLocation.id || typeof pinnedLocation.latitude !== 'number' || typeof pinnedLocation.longitude !== 'number') {
          console.error('❌ INVALID PINNED LOCATION DATA:', pinnedLocation);
          return null;
        }
        
        try {
          const position = { lat: pinnedLocation.latitude, lng: pinnedLocation.longitude };
          console.log('🔵 Pinned location position object:', position);
          
          return (
            <Marker
              key={`pinned-${pinnedLocation.id}`}
              position={position}
              onClick={() => {
                console.log('🔵 PINNED LOCATION MARKER CLICKED:', pinnedLocation.name);
                if (onPinnedLocationClick) {
                  onPinnedLocationClick(pinnedLocation);
                }
              }}
              icon={pinnedLocationIcon}
              title={`📌 ${pinnedLocation.name}`}
              onLoad={() => console.log('✅ PINNED LOCATION MARKER LOADED:', pinnedLocation.name)}
            />
          );
        } catch (error) {
          console.error('❌ ERROR CREATING PINNED LOCATION MARKER:', pinnedLocation.name, error);
          
          // Fallback: Try to render a basic marker without custom icon
          try {
            return (
              <Marker
                key={`pinned-fallback-${pinnedLocation.id}`}
                position={{ lat: pinnedLocation.latitude, lng: pinnedLocation.longitude }}
                onClick={() => {
                  console.log('🔵 PINNED LOCATION FALLBACK MARKER CLICKED:', pinnedLocation.name);
                  if (onPinnedLocationClick) {
                    onPinnedLocationClick(pinnedLocation);
                  }
                }}
                title={`📌 ${pinnedLocation.name} (fallback)`}
                onLoad={() => console.log('✅ PINNED LOCATION FALLBACK MARKER LOADED:', pinnedLocation.name)}
              />
            );
          } catch (fallbackError) {
            console.error('❌ PINNED LOCATION FALLBACK MARKER ALSO FAILED:', pinnedLocation.name, fallbackError);
            return null;
          }
        }
      })}

      {/* Info Window for search location */}
      {showSearchLocationInfo && searchLocation && (
        <InfoWindow
          position={{ lat: searchLocation.latitude, lng: searchLocation.longitude }}
          onCloseClick={() => setShowSearchLocationInfo(false)}
        >
          <div className="p-2">
            <h3 className="font-semibold text-lg text-red-600">🚨 SEARCH LOCATION</h3>
            <p className="text-sm text-gray-500 mt-2">
              Lat: {searchLocation.latitude.toFixed(6)}, Lng: {searchLocation.longitude.toFixed(6)}
            </p>
          </div>
        </InfoWindow>
      )}

      {/* Info Window for selected landmark */}
      {selectedLandmark && (
        <InfoWindow
          position={{ lat: selectedLandmark.latitude, lng: selectedLandmark.longitude }}
          onCloseClick={() => setSelectedLandmark(null)}
        >
          <div className="p-2">
            <h3 className="font-semibold text-lg text-gray-800">{selectedLandmark.name}</h3>
            {selectedLandmark.description && (
              <p className="text-gray-600 mt-1">{selectedLandmark.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Lat: {selectedLandmark.latitude.toFixed(4)}, Lng: {selectedLandmark.longitude.toFixed(4)}
            </p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default LocationMap; 