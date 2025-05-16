import React from 'react';
import { UserLocation } from '../services/locationService';

interface CurrentLocationDisplayProps {
  location: UserLocation;
  onUpdateLocation: () => void;
  onSaveAsLandmark: () => void;
}

const CurrentLocationDisplay: React.FC<CurrentLocationDisplayProps> = ({
  location,
  onUpdateLocation,
  onSaveAsLandmark
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Current Location</h2>
        <div className="flex gap-2">
          <button
            onClick={onUpdateLocation}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Update Location
          </button>
          <button
            onClick={onSaveAsLandmark}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Save as Landmark
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        Last updated: {new Date(location.last_updated).toLocaleString()}
      </p>
    </div>
  );
};

export default CurrentLocationDisplay; 