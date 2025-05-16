import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LocationMap from '../components/LocationMap';
import AddLandmarkForm from '../components/AddLandmarkForm';
import LandmarkList from '../components/LandmarkList';
import CurrentLocationDisplay from '../components/CurrentLocationDisplay';
import LocationService, { Location, UserLocation, Landmark } from '../services/locationService';

const LocationPage: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [isAddingLandmark, setIsAddingLandmark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadLocationData();
  }, []);

  const loadLocationData = async () => {
    try {
      setIsLoading(true);
      const [location, userLandmarks] = await Promise.all([
        LocationService.getCurrentLocation(),
        LocationService.getLandmarks()
      ]);
      setCurrentLocation(location);
      setLandmarks(userLandmarks);
    } catch (err) {
      setError('Failed to load location data');
      console.error('Error loading location data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            const updatedLocation = await LocationService.updateCurrentLocation(newLocation);
            setCurrentLocation(updatedLocation);
          },
          (error) => {
            setError('Failed to get current location');
            console.error('Geolocation error:', error);
          }
        );
      } else {
        setError('Geolocation is not supported by your browser');
      }
    } catch (err) {
      setError('Failed to update location');
      console.error('Error updating location:', err);
    }
  };

  const handleMapClick = (location: Location) => {
    setSelectedLocation(location);
    setIsAddingLandmark(true);
  };

  const handleLandmarkSave = async (name: string, description: string, locality: string) => {
    try {
      if (!selectedLocation) return;

      const newLandmark = await LocationService.saveLandmark({
        name,
        description,
        locality,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });

      setLandmarks([...landmarks, newLandmark]);
      setIsAddingLandmark(false);
      setSelectedLocation(null);
    } catch (err) {
      setError('Failed to save landmark');
      console.error('Error saving landmark:', err);
    }
  };

  const handleLandmarkDelete = async (landmarkId: number) => {
    try {
      await LocationService.deleteLandmark(landmarkId);
      setLandmarks(landmarks.filter(landmark => landmark.id !== landmarkId));
    } catch (err) {
      setError('Failed to delete landmark');
      console.error('Error deleting landmark:', err);
    }
  };

  const handleLandmarkSelect = (landmark: Landmark) => {
    setSelectedLandmark(landmark);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Location Management</h1>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Back to Dashboard
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading location data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Map and Current Location */}
          <div className="lg:col-span-2 space-y-6">
            <LocationMap
              currentLocation={currentLocation || undefined}
              landmarks={landmarks}
              onMapClick={handleMapClick}
              onMarkerClick={handleLandmarkSelect}
            />
            
            {currentLocation && (
              <CurrentLocationDisplay
                location={currentLocation}
                onUpdateLocation={handleUpdateLocation}
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
                }}
              />
            )}

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Saved Landmarks</h2>
              <LandmarkList
                landmarks={landmarks}
                onDelete={handleLandmarkDelete}
                onSelect={handleLandmarkSelect}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPage; 