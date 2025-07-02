import React from 'react';
import { Landmark } from '../services/locationService';

interface LandmarkListProps {
  landmarks: Landmark[];
  onDelete: (id: number) => void;
  onSelect: (landmark: Landmark) => void;
  viewingLandmarkId?: number | null;
}

const LandmarkList: React.FC<LandmarkListProps> = ({ landmarks, onDelete, onSelect, viewingLandmarkId }) => {
  if (landmarks.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No landmarks saved yet. Click on the map to add your first landmark!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {landmarks.map((landmark) => (
        <div
          key={landmark.id}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{landmark.name}</h3>
              {landmark.description && (
                <p className="text-sm text-gray-500 mt-1">{landmark.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Added on {new Date(landmark.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSelect(landmark)}
                disabled={viewingLandmarkId === landmark.id}
                className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                  viewingLandmarkId === landmark.id
                    ? 'text-blue-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
                title={
                  viewingLandmarkId === landmark.id
                    ? 'Scrolling to map...'
                    : `View ${landmark.name} on map - Will scroll to map and center on location`
                }
              >
                {viewingLandmarkId === landmark.id ? (
                  <span className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent"></div>
                    Viewing...
                  </span>
                ) : (
                  '🏛️ View'
                )}
              </button>
              <button
                onClick={() => onDelete(landmark.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LandmarkList; 