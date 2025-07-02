import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const [selectedPinnedLocation, setSelectedPinnedLocation] = useState<(Location & { id: string; name: string }) | null>(null);
  const [showPinnedLocationDialog, setShowPinnedLocationDialog] = useState(false);
  const [showMapClickDialog, setShowMapClickDialog] = useState(false);
  const [mapClickLocation, setMapClickLocation] = useState<Location | null>(null);
  const [lastMapClickTime, setLastMapClickTime] = useState<number>(0);
  const [viewingPinnedLocationId, setViewingPinnedLocationId] = useState<string | null>(null);
  const [viewingLandmarkId, setViewingLandmarkId] = useState<number | null>(null);

  // Ref for smooth scrolling to map
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to map utility function
  const scrollToMap = useCallback(() => {
    try {
      if (mapContainerRef.current) {
        const mapElement = mapContainerRef.current;
        const headerOffset = 80; // Account for any fixed headers
        const elementPosition = mapElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        console.log('📜 SCROLLING TO MAP:', {
          elementPosition,
          offsetPosition,
          currentScroll: window.pageYOffset
        });

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Add a subtle highlight effect to draw attention to the map
        mapElement.style.transition = 'box-shadow 0.3s ease-out';
        mapElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
        
        // Remove highlight after animation
        setTimeout(() => {
          mapElement.style.boxShadow = '';
        }, 2000);

        return true;
      } else {
        console.warn('⚠️ Map container ref not found for scrolling');
        return false;
      }
    } catch (error) {
      console.error('❌ Error scrolling to map:', error);
      return false;
    }
  }, []);

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

  // Handle keyboard events for dialogs
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showMapClickDialog) {
          handleCloseMapClickDialog();
        } else if (showPinnedLocationDialog) {
          handleClosePinnedLocationDialog();
        }
      }
    };

    if (showMapClickDialog || showPinnedLocationDialog) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showMapClickDialog, showPinnedLocationDialog]);

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

    // Validate location data
    if (typeof lastSearchedLocation.latitude !== 'number' || 
        typeof lastSearchedLocation.longitude !== 'number' ||
        isNaN(lastSearchedLocation.latitude) || 
        isNaN(lastSearchedLocation.longitude)) {
      setError('Invalid location data. Cannot pin location.');
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
    
    // Close dialog if this location was selected
    if (selectedPinnedLocation?.id === pinnedLocationId) {
      setShowPinnedLocationDialog(false);
      setSelectedPinnedLocation(null);
    }
    
    // Clear search location if it was this pinned location
    if (searchLocation && 
        searchLocation.latitude === locationToRemove.latitude && 
        searchLocation.longitude === locationToRemove.longitude) {
      setSearchLocation(null);
    }
    
    // Show success message
    setSuccessMessage(`Removed pinned location "${locationToRemove.name}"`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleViewPinnedLocation = (pinnedLocation: Location & { id: string; name: string }) => {
    console.log('📍 VIEWING PINNED LOCATION:', pinnedLocation);
    
    // Set loading state for this specific pinned location
    setViewingPinnedLocationId(pinnedLocation.id);
    
    // Validate pinned location data for security
    if (!pinnedLocation || 
        typeof pinnedLocation.latitude !== 'number' || 
        typeof pinnedLocation.longitude !== 'number' ||
        isNaN(pinnedLocation.latitude) || 
        isNaN(pinnedLocation.longitude)) {
      setError('Invalid pinned location data. Cannot view location.');
      setViewingPinnedLocationId(null);
      return;
    }
    
    // Set as search location to show red marker and center map
    setSearchLocation({
      latitude: pinnedLocation.latitude,
      longitude: pinnedLocation.longitude
    });
    
    // Clear any previous errors
    setError(null);
    
    // Smooth scroll to map with a small delay to ensure state updates
    setTimeout(() => {
      const scrollSuccess = scrollToMap();
      if (scrollSuccess) {
        // Show success message with scroll indication
        setSuccessMessage(`🔍 Viewing: ${pinnedLocation.name} - Scrolled to map and centered on location. Click the blue marker for options.`);
      } else {
        // Fallback message if scroll fails
        setSuccessMessage(`🔍 Viewing: ${pinnedLocation.name} - Map centered on location. Click the blue marker for options.`);
      }
      
      // Clear loading state after scroll completes
      setTimeout(() => {
        setViewingPinnedLocationId(null);
      }, 1000); // Give time for scroll animation to complete
      
      setTimeout(() => setSuccessMessage(null), 5000); // Longer timeout for the helpful message
    }, 100); // Small delay to ensure search location is set first
  };

  const handlePinnedLocationMarkerClick = (pinnedLocation: Location & { id: string; name: string }) => {
    console.log('🔵 PINNED LOCATION MARKER CLICKED:', pinnedLocation);
    
    // Validate pinned location data for security
    if (!pinnedLocation || 
        typeof pinnedLocation.latitude !== 'number' || 
        typeof pinnedLocation.longitude !== 'number' ||
        isNaN(pinnedLocation.latitude) || 
        isNaN(pinnedLocation.longitude)) {
      setError('Invalid pinned location data.');
      return;
    }
    
    // Set selected pinned location for dialog
    setSelectedPinnedLocation(pinnedLocation);
    setShowPinnedLocationDialog(true);
    
    // Clear any previous errors
    setError(null);
    
    // Show success message
    setSuccessMessage(`📌 ${pinnedLocation.name} - Conversion options available`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleConvertPinnedToLandmark = (pinnedLocation: Location & { id: string; name: string }) => {
    console.log('🏷️ CONVERTING PINNED LOCATION TO LANDMARK:', pinnedLocation);
    
    // Set the location for landmark creation
    setSelectedLocation({
      latitude: pinnedLocation.latitude,
      longitude: pinnedLocation.longitude
    });
    
    // Close the dialog
    setShowPinnedLocationDialog(false);
    setSelectedPinnedLocation(null);
    
    // Open landmark form
    setIsAddingLandmark(true);
    
    // Show success message
    setSuccessMessage(`Converting "${pinnedLocation.name}" to permanent landmark - Please fill in details`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleClosePinnedLocationDialog = () => {
    setShowPinnedLocationDialog(false);
    setSelectedPinnedLocation(null);
  };

  const handleMapClick = (location: Location) => {
    console.log('🗺️ MAP CLICKED at:', location);
    
    // Rate limiting: prevent spam clicks (minimum 500ms between clicks)
    const now = Date.now();
    if (now - lastMapClickTime < 500) {
      console.log('⏱️ Rate limited: Map click too soon after previous click');
      return;
    }
    setLastMapClickTime(now);
    
    // Validate location data for security
    if (!location || 
        typeof location.latitude !== 'number' || 
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) || 
        isNaN(location.longitude) ||
        location.latitude < -90 || 
        location.latitude > 90 ||
        location.longitude < -180 || 
        location.longitude > 180) {
      console.error('Invalid location data:', location);
      setError('Invalid location data. Please try again.');
      return;
    }
    
    // Show options dialog for map click
    setMapClickLocation(location);
    setShowMapClickDialog(true);
  };

  const handlePinLocationFromMap = (location: Location) => {
    // Validate location data
    if (!location || 
        typeof location.latitude !== 'number' || 
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) || 
        isNaN(location.longitude)) {
      setError('Invalid location data. Cannot pin location.');
      return;
    }

    // Generate a unique ID for the pinned location
    const pinnedLocationId = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a name for the pinned location
    const locationName = `Pinned Location ${pinnedLocations.length + 1}`;
    
    const newPinnedLocation = {
      ...location,
      id: pinnedLocationId,
      name: locationName
    };

    console.log('📍 PINNING LOCATION FROM MAP:', newPinnedLocation);
    
    // Add to pinned locations
    setPinnedLocations(prev => [...prev, newPinnedLocation]);
    
    // Set as search location to show red marker and center map
    setSearchLocation(location);
    
    // Show success message
    setSuccessMessage(`Location pinned as "${locationName}" - Click to view options`);
    setTimeout(() => setSuccessMessage(null), 5000);
    
    // Clear any errors
    setError(null);
  };

  const handleLandmarkSelect = (landmark: Landmark) => {
    console.log('🟢 LANDMARK SELECTED:', landmark);
    
    // Set loading state for this specific landmark
    setViewingLandmarkId(landmark.id);
    
    // Validate landmark data for security
    if (!landmark || 
        typeof landmark.latitude !== 'number' || 
        typeof landmark.longitude !== 'number' ||
        isNaN(landmark.latitude) || 
        isNaN(landmark.longitude)) {
      setError('Invalid landmark data. Cannot view location.');
      setViewingLandmarkId(null);
      return;
    }
    
    setSelectedLandmark(landmark);
    
    // Clear any previous errors
    setError(null);
    
    // Smooth scroll to map with a small delay to ensure state updates
    setTimeout(() => {
      const scrollSuccess = scrollToMap();
      if (scrollSuccess) {
        // Show success message with scroll indication
        setSuccessMessage(`🏛️ Viewing landmark: ${landmark.name} - Scrolled to map and centered on location`);
      } else {
        // Fallback message if scroll fails
        setSuccessMessage(`🏛️ Viewing landmark: ${landmark.name} - Map centered on location`);
      }
      
      // Clear loading state after scroll completes
      setTimeout(() => {
        setViewingLandmarkId(null);
      }, 1000); // Give time for scroll animation to complete
      
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 100); // Small delay to ensure state updates are processed
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

  const handlePinCurrentLocation = () => {
    if (!currentLocation) {
      setError('No current location available to pin.');
      return;
    }

    // Validate current location data for security
    if (typeof currentLocation.latitude !== 'number' || 
        typeof currentLocation.longitude !== 'number' ||
        isNaN(currentLocation.latitude) || 
        isNaN(currentLocation.longitude)) {
      setError('Invalid current location data. Cannot pin location.');
      return;
    }

    // Generate a unique ID for the pinned location
    const pinnedLocationId = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a name for the pinned current location
    const locationName = `Current Location ${pinnedLocations.length + 1}`;
    
    const newPinnedLocation = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      id: pinnedLocationId,
      name: locationName
    };

    console.log('📍 PINNING CURRENT LOCATION:', newPinnedLocation);
    
    // Add to pinned locations
    setPinnedLocations(prev => [...prev, newPinnedLocation]);
    
    // Set as search location to show red marker and center map
    setSearchLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    });
    
    // Show success message
    setSuccessMessage(`Current location pinned as "${locationName}"`);
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Clear any errors
    setError(null);
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

  const handleCloseMapClickDialog = () => {
    setShowMapClickDialog(false);
    setMapClickLocation(null);
    // Reset rate limiting when dialog closes
    setLastMapClickTime(0);
  };

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
            {/* Quick Start Guide */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Quick Start Guide</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-800 uppercase tracking-wide">Map Interactions</h5>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <p className="text-sm text-gray-700">
                        <strong>Click anywhere on map</strong> to pin locations or save as landmarks
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <p className="text-sm text-gray-700">
                        <strong>Click blue markers</strong> to access conversion options for pinned locations
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-800 uppercase tracking-wide">Marker Types</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full border border-red-600"></div>
                      <p className="text-sm text-gray-700">Current search location</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full border border-blue-600"></div>
                      <p className="text-sm text-gray-700">Pinned locations (temporary)</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-yellow-400"></div>
                      <p className="text-sm text-gray-700">Saved landmarks (permanent)</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-blue-200">
                <h5 className="text-sm font-medium text-gray-800 uppercase tracking-wide mb-2">Navigation Actions</h5>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-base">🔍</span>
                    <span className="text-gray-700">View pinned - scroll & center</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-base">🏛️</span>
                    <span className="text-gray-700">View landmarks - scroll & center</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-base">📌</span>
                    <span className="text-gray-700">Pin current/search locations</span>
                  </div>
                </div>
              </div>
            </div>

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

            <div ref={mapContainerRef} className="transition-shadow duration-300">
              <LocationMap
                currentLocation={currentLocation || undefined}
                landmarks={landmarks}
                pinnedLocations={pinnedLocations}
                selectedLandmarkFromList={selectedLandmark}
                onMapClick={handleMapClick}
                onMarkerClick={handleLandmarkSelect}
                onPinnedLocationClick={handlePinnedLocationMarkerClick}
                searchLocation={searchLocation}
              />
            </div>
            
            {currentLocation && (
              <CurrentLocationDisplay
                location={currentLocation}
                onUpdateLocation={handleUpdateLocation}
                onSaveAsLandmark={handleSaveCurrentLocationAsLandmark}
                onPinLocation={handlePinCurrentLocation}
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
              
              <LandmarkList
                landmarks={landmarks}
                onDelete={handleLandmarkDelete}
                onSelect={handleLandmarkSelect}
                viewingLandmarkId={viewingLandmarkId}
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
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewPinnedLocation(pinnedLocation)}
                            disabled={viewingPinnedLocationId === pinnedLocation.id}
                            className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                              viewingPinnedLocationId === pinnedLocation.id
                                ? 'text-blue-400 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-800'
                            }`}
                            title={
                              viewingPinnedLocationId === pinnedLocation.id
                                ? 'Scrolling to map...'
                                : `View ${pinnedLocation.name} on map - Scrolls to map and centers on location. Click the blue marker for conversion options.`
                            }
                          >
                            {viewingPinnedLocationId === pinnedLocation.id ? (
                              <span className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent"></div>
                                Viewing...
                              </span>
                            ) : (
                              '🔍 View'
                            )}
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

      {/* Pinned Location Dialog */}
      {showPinnedLocationDialog && selectedPinnedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📌 {selectedPinnedLocation.name}
              </h3>
              <button
                onClick={handleClosePinnedLocationDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                This pinned location is temporary and will be lost when you refresh the page.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleConvertPinnedToLandmark(selectedPinnedLocation)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                🏷️ Convert to Permanent Landmark
              </button>
              
              <button
                onClick={() => handleRemovePinnedLocation(selectedPinnedLocation.id)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                🗑️ Remove Pin
              </button>
              
              <button
                onClick={handleClosePinnedLocationDialog}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Click Dialog */}
      {showMapClickDialog && mapClickLocation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close dialog if clicking on backdrop
            if (e.target === e.currentTarget) {
              handleCloseMapClickDialog();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-click-dialog-title"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 
                id="map-click-dialog-title"
                className="text-lg font-semibold text-gray-900"
              >
                📍 Map Location Options
              </h3>
              <button
                onClick={handleCloseMapClickDialog}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Choose how you'd like to save this location:
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  handlePinLocationFromMap(mapClickLocation);
                  handleCloseMapClickDialog();
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
              >
                📌 Pin Location (Temporary)
                <span className="block text-xs text-blue-100 mt-1">
                  Quick pin for this session only
                </span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedLocation(mapClickLocation);
                  setIsAddingLandmark(true);
                  handleCloseMapClickDialog();
                }}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium"
              >
                🏷️ Add as Permanent Landmark
                <span className="block text-xs text-indigo-100 mt-1">
                  Save permanently with name & description
                </span>
              </button>
              
              <button
                onClick={handleCloseMapClickDialog}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPage; 