import React from 'react';
import { UserLocation } from '../services/locationService';

interface CurrentLocationDisplayProps {
  location: UserLocation;
  onUpdateLocation: () => void;
  onSaveAsLandmark: () => void;
  onPinLocation: () => void;
  isUpdating?: boolean;
}

const CurrentLocationDisplay: React.FC<CurrentLocationDisplayProps> = ({
  location,
  onUpdateLocation,
  onSaveAsLandmark,
  onPinLocation,
  isUpdating = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">Current Location</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onUpdateLocation}
            disabled={isUpdating}
            className={`px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors whitespace-nowrap ${
              isUpdating
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
            }`}
          >
            {isUpdating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                Updating...
              </div>
            ) : (
              'Update Location'
            )}
          </button>
          <button
            onClick={onPinLocation}
            disabled={isUpdating}
            className={`px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 transition-colors whitespace-nowrap ${
              isUpdating
                ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
            title="Pin current location to the map"
          >
            📌 Pin Location
          </button>
          <button
            onClick={onSaveAsLandmark}
            disabled={isUpdating}
            className={`px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 transition-colors whitespace-nowrap ${
              isUpdating
                ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            }`}
          >
            Save as Landmark
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Last updated:</span>
          <span className="text-sm text-gray-600">
            {new Date(location.last_updated).toLocaleString()}
          </span>
        </div>
        
        {isUpdating && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              📍 Getting your current location...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentLocationDisplay; 