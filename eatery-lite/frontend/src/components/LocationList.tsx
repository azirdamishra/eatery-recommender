import React from 'react';
import { Location } from '../types';

interface LocationListProps {
  locations: Location[];
  onLocationClick?: (location: Location) => void;
  onLocationRemove?: (location: Location) => void;
  isRemoving?: string; // locationId currently being removed
}

const LocationList: React.FC<LocationListProps> = ({
  locations,
  onLocationClick,
  onLocationRemove,
  isRemoving
}) => {
  if (locations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-3">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-1">No locations yet</h3>
        <p className="text-gray-500">
          Click on the map to add your first location!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Locations ({locations.length})
      </h3>
      
      {locations.map((location) => (
        <div
          key={location.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onLocationClick?.(location)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {location.name}
                </h4>
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
              </div>
              
              {location.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {location.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {location.addedBy}
                </span>
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {new Date(location.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {onLocationRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLocationRemove(location);
                }}
                disabled={isRemoving === location.id}
                className="ml-3 p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Remove location"
              >
                {isRemoving === location.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
          
          <div className="mt-2 text-xs text-gray-400 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LocationList;
