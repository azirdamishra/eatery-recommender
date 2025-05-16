import React from 'react';
import { UserLocation } from '../services/locationService';

interface CurrentLocationDisplayProps {
  location: UserLocation;
  onUpdateLocation: () => void;
}

const CurrentLocationDisplay: React.FC<CurrentLocationDisplayProps> = ({
  location,
  onUpdateLocation
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Current Location</h3>
        <button
          onClick={onUpdateLocation}
          className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          Update
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Latitude:</span>
          <span className="text-sm font-medium">{location.latitude.toFixed(6)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Longitude:</span>
          <span className="text-sm font-medium">{location.longitude.toFixed(6)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Last Updated:</span>
          <span className="text-sm font-medium">
            {new Date(location.last_updated).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CurrentLocationDisplay; 