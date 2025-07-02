import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useJsApiLoader } from '@react-google-maps/api';
import LocationMap from '../components/LocationMap';
import AddLandmarkForm from '../components/AddLandmarkForm';
import LandmarkList from '../components/LandmarkList';
import CurrentLocationDisplay from '../components/CurrentLocationDisplay';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import LocationService, { Location, UserLocation, Landmark } from '../services/locationService';
import { GOOGLE_MAPS_OPTIONS } from '../config/maps';

interface LoadingState {
  isLoading: boolean;
  isLoadingLocation: boolean;
  isLoadingLandmarks: boolean;
  isRetrying: boolean;
}

const LocationPage: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [isAddingLandmark, setIsAddingLandmark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isLoadingLocation: false,
    isLoadingLandmarks: false,
    isRetrying: false
  });
  const [searchLocation, setSearchLocation] = useState<Location | null>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // New state for pinned locations
  const [pinnedLocations, setPinnedLocations] = useState<Array<Location & { id: string; name: string }>>([]);
  const [lastSearchedLocation, setLastSearchedLocation] = useState<Location | null>(null);

  const { isLoaded: isMapsLoaded } = useJsApiLoader(GOOGLE_MAPS_OPTIONS);

  // Enhanced error handling function
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    if (error.response?.status === 401) {
      setError('Authentication failed. Please log in again.');
      // Redirect to login or handle auth error
      return;
    }
    
    if (error.response?.status === 403) {
      setError('Access denied. You do not have permission to access this resource.');
      return;
    }
    
    if (error.response?.status >= 500) {
      setError('Server error. Please try again later.');
      return;
    }
    
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      setError('Network error. Please check your connection and try again.');
      return;
    }
    
    setError(`Failed to ${context.toLowerCase()}. Please try again.`);
  }, []);

  // Retry mechanism for failed requests
  const retryOperation = useCallback(async (operation: () => Promise<void>, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setLoadingState(prev => ({ ...prev, isRetrying: attempt > 1 }));
        await operation();
        setRetryCount(0);
        setLoadingState(prev => ({ ...prev, isRetrying: false }));
        return;
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          setRetryCount(attempt);
          setLoadingState(prev => ({ ...prev, isRetrying: false }));
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }, []);

  // Load location data with enhanced error handling
  const loadLocationData = useCallback(async () => {
    try {
      setLoadingState(prev => ({ ...prev, isLoading: true }));
      setError(null);

      await retryOperation(async () => {
        // Load location and landmarks in parallel for better performance
        const promises = [
          (async () => {
            setLoadingState(prev => ({ ...prev, isLoadingLocation: true }));
            try {
              const location = await LocationService.getCurrentLocation();
              setCurrentLocation(location);
              
              // Set search location to current location so user can see where they are
              if (location) {
                setSearchLocation({
                  latitude: location.latitude,
                  longitude: location.longitude
                });
              }
            } finally {
              setLoadingState(prev => ({ ...prev, isLoadingLocation: false }));
            }
          })(),
          
          (async () => {
            setLoadingState(prev => ({ ...prev, isLoadingLandmarks: true }));
            try {
              const userLandmarks = await LocationService.getLandmarks();
              console.log('📍 Loaded landmarks:', userLandmarks.length, userLandmarks);
              setLandmarks(userLandmarks);
            } finally {
              setLoadingState(prev => ({ ...prev, isLoadingLandmarks: false }));
            }
          })()
        ];

        await Promise.all(promises);
      });
      
    } catch (err: any) {
      handleError(err, 'load location data');
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [retryOperation, handleError]);

  // Load initial data on component mount
  useEffect(() => {
    loadLocationData();
  }, [loadLocationData]);

  // Manual retry function
  const handleRetry = useCallback(() => {
    loadLocationData();
  }, [loadLocationData]);

  const handleUpdateLocation = async () => {
    try {
      setIsUpdatingLocation(true);
      setError(null); // Clear any previous errors
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              const updatedLocation = await LocationService.updateCurrentLocation(newLocation);
              setCurrentLocation(updatedLocation);
              
              // Set the search location to show the red marker at current location
              setSearchLocation({
                latitude: updatedLocation.latitude,
                longitude: updatedLocation.longitude
              });
              
              // Show success message briefly
              setSuccessMessage('Location updated successfully!');
              setTimeout(() => {
                setIsUpdatingLocation(false);
                setSuccessMessage(null);
              }, 2000); // Show success for 2 seconds
              
            } catch (apiError) {
              setError('Failed to save location to server');
              console.error('API error:', apiError);
              setIsUpdatingLocation(false);
            }
          },
          (geoError) => {
            setError('Failed to get current location. Please check your location permissions.');
            console.error('Geolocation error:', geoError);
            setIsUpdatingLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        setError('Geolocation is not supported by your browser');
        setIsUpdatingLocation(false);
      }
    } catch (err) {
      setError('Failed to update location');
      console.error('Error updating location:', err);
      setIsUpdatingLocation(false);
    }
  };

  const handlePlaceSelected = (location: Location) => {
    console.log('🔍 PLACE SELECTED:', location);
    setSearchLocation(location);
    setLastSearchedLocation(location);
    setShowSaveButton(true);
    // Clear any previous errors when user selects a new location
    setError(null);
  };

  const handlePinLocation = () => {
    if (!lastSearchedLocation) {
      setError('No location to pin. Please search for a location first.');
      return;
    }

    // Generate a unique ID for the pinned location
    const pinnedLocationId = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a name for the pinned location (you could make this customizable)
    const locationName = `Pinned Location ${pinnedLocations.length + 1}`;
    
    const newPinnedLocation = {
      ...lastSearchedLocation,
      id: pinnedLocationId,
      name: locationName
    };

    console.log('📍 PINNING LOCATION:', newPinnedLocation);
    
    // Add to pinned locations
    setPinnedLocations(prev => [...prev, newPinnedLocation]);
    
    // Show success message
    setSuccessMessage(`Location pinned as "${locationName}"`);
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Clear any errors
    setError(null);
  };

  const handleRemovePinnedLocation = (pinnedLocationId: string) => {
    const locationToRemove = pinnedLocations.find(loc => loc.id === pinnedLocationId);
    if (!locationToRemove) return;

    console.log('📍 REMOVING PINNED LOCATION:', locationToRemove);
    
    // Remove from pinned locations
    setPinnedLocations(prev => prev.filter(loc => loc.id !== pinnedLocationId));
    
    // Show success message
    setSuccessMessage(`Removed pinned location "${locationToRemove.name}"`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleViewPinnedLocation = (pinnedLocation: Location & { id: string; name: string }) => {
    console.log('📍 VIEWING PINNED LOCATION:', pinnedLocation);
    
    // Set as search location to show red marker and center map
    setSearchLocation({
      latitude: pinnedLocation.latitude,
      longitude: pinnedLocation.longitude
    });
    
    // Clear any previous errors
    setError(null);
    
    // Show success message
    setSuccessMessage(`Viewing pinned location: ${pinnedLocation.name}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleMapClick = (location: Location) => {
    setSelectedLocation(location);
    setIsAddingLandmark(true);
  };

  const handleLandmarkSelect = (landmark: Landmark) => {
    console.log('🟢 LANDMARK SELECTED:', landmark);
    setSelectedLandmark(landmark);
    
    // Set the search location to the landmark so it shows on the map with red marker
    setSearchLocation({
      latitude: landmark.latitude,
      longitude: landmark.longitude
    });
    
    // Clear any previous errors
    setError(null);
    
    // Show success message
    setSuccessMessage(`Viewing landmark: ${landmark.name}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveSearchLocation = () => {
    if (searchLocation) {
      setSelectedLocation(searchLocation);
      setIsAddingLandmark(true);
    }
  };

  const handleSaveCurrentLocationAsLandmark = () => {
    if (currentLocation) {
      setSelectedLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      });
      setIsAddingLandmark(true);
    }
  };

  // Enhanced landmark save with better state management
  const handleLandmarkSave = useCallback(async (name: string, description: string) => {
    try {
      if (!selectedLocation) {
        setError('No location selected for landmark');
        return;
      }

      setLoadingState(prev => ({ ...prev, isLoading: true }));
      setError(null);

      const newLandmark = await LocationService.saveLandmark({
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });

      console.log('✅ LANDMARK SAVED:', newLandmark);

      // Update landmarks state
      setLandmarks(prev => [...prev, newLandmark]);
      
      // Clean up form state
      setIsAddingLandmark(false);
      setSelectedLocation(null);
      setShowSaveButton(false);
      setSearchLocation(null);
      
      // Show success message
      setSuccessMessage(`Landmark "${newLandmark.name}" saved successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err: any) {
      handleError(err, 'save landmark');
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [selectedLocation, handleError]);

  // Enhanced landmark delete with optimistic updates
  const handleLandmarkDelete = useCallback(async (landmarkId: number) => {
    try {
      const landmarkToDelete = landmarks.find(l => l.id === landmarkId);
      if (!landmarkToDelete) {
        setError('Landmark not found');
        return;
      }

      // Optimistic update - remove from UI immediately
      setLandmarks(prev => prev.filter(landmark => landmark.id !== landmarkId));
      
      // Show loading state
      setLoadingState(prev => ({ ...prev, isLoading: true }));
      setError(null);

      await LocationService.deleteLandmark(landmarkId);
      
      console.log('✅ LANDMARK DELETED:', landmarkId);
      
      // Show success message
      setSuccessMessage(`Landmark "${landmarkToDelete.name}" deleted successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err: any) {
      // Restore the landmark on error (rollback optimistic update)
      await loadLocationData();
      handleError(err, 'delete landmark');
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [landmarks, loadLocationData, handleError]);

  if (!isMapsLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold"></h1>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Back to Dashboard
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <div className="flex gap-2">
              {retryCount > 0 && (
                <span className="text-sm text-red-600">
                  (Attempt {retryCount}/3)
                </span>
              )}
              <button
                onClick={handleRetry}
                disabled={loadingState.isRetrying}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loadingState.isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {loadingState.isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {loadingState.isRetrying ? 'Retrying...' : 'Loading location data...'}
          </p>
          {loadingState.isLoadingLocation && (
            <p className="text-sm text-gray-500">Loading current location...</p>
          )}
          {loadingState.isLoadingLandmarks && (
            <p className="text-sm text-gray-500">Loading saved landmarks...</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Map and Current Location */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <PlacesAutocomplete onPlaceSelected={handlePlaceSelected} />
                  </div>
                  <button
                    onClick={handlePinLocation}
                    disabled={!lastSearchedLocation}
                    className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      lastSearchedLocation
                        ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                    title={lastSearchedLocation ? 'Pin this location to the map' : 'Search for a location first'}
                  >
                    📌 Pin Location
                  </button>
                </div>
              </div>
              {showSaveButton && searchLocation && (
                <button
                  onClick={handleSaveSearchLocation}
                  className="w-full mb-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Save as Landmark
                </button>
              )}
            </div>

            <LocationMap
              currentLocation={currentLocation || undefined}
              landmarks={landmarks}
              pinnedLocations={pinnedLocations}
              onMapClick={handleMapClick}
              onMarkerClick={handleLandmarkSelect}
              onPinnedLocationClick={handleViewPinnedLocation}
              searchLocation={searchLocation}
            />
            
            {currentLocation && (
              <CurrentLocationDisplay
                location={currentLocation}
                onUpdateLocation={handleUpdateLocation}
                onSaveAsLandmark={handleSaveCurrentLocationAsLandmark}
                isUpdating={isUpdatingLocation}
              />
            )}
          </div>

          {/* Right column - Landmarks and Forms */}
          <div className="space-y-6">
            {isAddingLandmark && selectedLocation && (
              <AddLandmarkForm
                location={selectedLocation}
                onSave={handleLandmarkSave}
                onCancel={() => {
                  setIsAddingLandmark(false);
                  setSelectedLocation(null);
                  setShowSaveButton(false);
                  setSearchLocation(null);
                }}
              />
            )}

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Saved Landmarks</h2>
              
              {/* DEBUG SECTION - Remove in production */}
              <div className="mb-4 p-3 bg-gray-50 border rounded text-sm">
                <h3 className="font-medium text-gray-700 mb-2">🔍 Debug Info:</h3>
                <p><strong>Loading state:</strong> {JSON.stringify(loadingState)}</p>
                <p><strong>Landmarks count:</strong> {landmarks?.length || 0}</p>
                <p><strong>Pinned locations count:</strong> {pinnedLocations?.length || 0}</p>
                <p><strong>Landmarks data:</strong> {JSON.stringify(landmarks, null, 2)}</p>
                <p><strong>Pinned locations:</strong> {JSON.stringify(pinnedLocations, null, 2)}</p>
                <button
                  onClick={() => {
                    console.log('🔄 Manual landmarks reload triggered');
                    loadLocationData();
                  }}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Force Reload Landmarks
                </button>
              </div>
              
              <LandmarkList
                landmarks={landmarks}
                onDelete={handleLandmarkDelete}
                onSelect={handleLandmarkSelect}
              />
            </div>

            {/* Pinned Locations Section */}
            {pinnedLocations.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">📌 Pinned Locations</h2>
                <div className="space-y-3">
                  {pinnedLocations.map((pinnedLocation) => (
                    <div
                      key={pinnedLocation.id}
                      className="bg-blue-50 p-3 rounded-lg border border-blue-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-blue-900">{pinnedLocation.name}</h3>
                          <p className="text-xs text-blue-700 mt-1">
                            {pinnedLocation.latitude.toFixed(6)}, {pinnedLocation.longitude.toFixed(6)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewPinnedLocation(pinnedLocation)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleRemovePinnedLocation(pinnedLocation.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPage; 