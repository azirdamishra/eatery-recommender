import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Group, Location, MapLocation, CreateLocationRequest } from '../types';
import { apiService } from '../services/api';
import Map from '../components/Map';
import LocationList from '../components/LocationList';
import AddLocationForm from '../components/AddLocationForm';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import CurrentLocationButton from '../components/CurrentLocationButton';

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  // State management
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<MapLocation | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [removingLocationId, setRemovingLocationId] = useState<string | null>(null);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  // Auto-refresh interval
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Search and location state
  const [searchLocation, setSearchLocation] = useState<MapLocation & { name?: string; address?: string } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null);

  // Load group data
  const loadGroup = async () => {
    if (!groupId) {
      setError('No group ID provided');
      setLoading(false);
      return;
    }

    try {
      const groupData = await apiService.getGroup(groupId);
      setGroup(groupData);
      setError(null);
    } catch (err: any) {
      console.error('Error loading group:', err);
      if (err.response?.status === 404) {
        setError('Group not found. Please check the URL.');
      } else {
        setError('Failed to load group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadGroup();
  }, [groupId]);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh || !group) return;

    const interval = setInterval(() => {
      loadGroup();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, group, groupId]);

  // Handle map click
  const handleMapClick = (location: MapLocation) => {
    setSelectedPosition(location);
    setShowAddForm(true);
  };

  // Handle adding a new location
  const handleAddLocation = async (locationData: CreateLocationRequest) => {
    if (!groupId) return;

    setIsAddingLocation(true);
    try {
      const newLocation = await apiService.addLocation(groupId, locationData);
      
      // Update the group state with the new location
      setGroup(prev => prev ? {
        ...prev,
        locations: [...prev.locations, newLocation]
      } : null);

      // Close the form and reset position
      setShowAddForm(false);
      setSelectedPosition(null);
    } catch (err: any) {
      console.error('Error adding location:', err);
      setError('Failed to add location. Please try again.');
    } finally {
      setIsAddingLocation(false);
    }
  };

  // Handle removing a location
  const handleRemoveLocation = async (location: Location) => {
    if (!groupId || !confirm(`Are you sure you want to remove "${location.name}"?`)) return;

    setRemovingLocationId(location.id);
    try {
      await apiService.removeLocation(groupId, location.id);
      
      // Update the group state by removing the location
      setGroup(prev => prev ? {
        ...prev,
        locations: prev.locations.filter(l => l.id !== location.id)
      } : null);
    } catch (err: any) {
      console.error('Error removing location:', err);
      setError('Failed to remove location. Please try again.');
    } finally {
      setRemovingLocationId(null);
    }
  };

  // Handle location click in list (pan to location on map)
  const handleLocationClick = (location: Location) => {
    // This would scroll the map to the location - implemented in Map component
  };

  // Handle place selection from search
  const handlePlaceSelect = (place: MapLocation & { name: string; address: string }) => {
    setSearchLocation(place);
  };

  // Handle current location found
  const handleCurrentLocationFound = (location: MapLocation) => {
    setCurrentLocation(location);
  };

  // Clear search location
  const handleClearSearch = () => {
    setSearchLocation(null);
  };

  // Share URL functionality
  const handleShareUrl = async () => {
    const url = window.location.href;
    
    try {
      await navigator.clipboard.writeText(url);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error || 'Group not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'Group not found. Please check the URL.' 
              ? 'The group you\'re looking for doesn\'t exist or may have been removed.'
              : 'Something went wrong while loading the group.'
            }
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Create New Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Create new group"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                {group.description && (
                  <p className="text-gray-600 text-sm">{group.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={`Auto-refresh: ${autoRefresh ? 'ON' : 'OFF'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Share button */}
              <button
                onClick={handleShareUrl}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  shareUrlCopied 
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {shareUrlCopied ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Shared Map
                </h2>
                <p className="text-sm text-gray-500">
                  Click anywhere to add a location
                </p>
              </div>

              {/* Search and Location Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Places Search */}
                  <div className="flex-1">
                    <PlacesAutocomplete
                      onPlaceSelect={handlePlaceSelect}
                      placeholder="Search for restaurants, landmarks, or addresses..."
                      className="w-full"
                    />
                  </div>
                  
                  {/* Current Location Button */}
                  <CurrentLocationButton
                    onLocationFound={handleCurrentLocationFound}
                    onError={(error) => setError(error)}
                    className="sm:w-auto"
                  />
                </div>

                {/* Search Result Display */}
                {searchLocation && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-blue-900">
                          {searchLocation.name || 'Selected Location'}
                        </p>
                        {searchLocation.address && (
                          <p className="text-sm text-blue-700">{searchLocation.address}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleClearSearch}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <Map
                locations={group.locations}
                onMapClick={handleMapClick}
                onLocationClick={handleLocationClick}
                center={group.locations.length > 0 ? {
                  latitude: group.locations[0].latitude,
                  longitude: group.locations[0].longitude
                } : undefined}
                searchLocation={searchLocation}
                currentLocation={currentLocation}
              />
            </div>

            {/* Add Location Form */}
            {showAddForm && (
              <div className="animate-fade-in">
                <AddLocationForm
                  onSubmit={handleAddLocation}
                  onCancel={() => {
                    setShowAddForm(false);
                    setSelectedPosition(null);
                  }}
                  selectedPosition={selectedPosition || undefined}
                  isLoading={isAddingLocation}
                />
              </div>
            )}
          </div>

          {/* Locations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <LocationList
                locations={group.locations}
                onLocationClick={handleLocationClick}
                onLocationRemove={handleRemoveLocation}
                isRemoving={removingLocationId || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
