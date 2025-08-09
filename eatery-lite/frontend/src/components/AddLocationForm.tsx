import React, { useState } from 'react';
import { CreateLocationRequest, MapLocation } from '../types';

interface AddLocationFormProps {
  onSubmit: (location: CreateLocationRequest) => void;
  onCancel: () => void;
  selectedPosition?: MapLocation;
  isLoading?: boolean;
}

const AddLocationForm: React.FC<AddLocationFormProps> = ({
  onSubmit,
  onCancel,
  selectedPosition,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    addedBy: '',
    latitude: selectedPosition?.latitude || 0,
    longitude: selectedPosition?.longitude || 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required';
    }

    if (!formData.addedBy.trim()) {
      newErrors.addedBy = 'Your name is required';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.position = 'Please click on the map to select a location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      addedBy: formData.addedBy.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  React.useEffect(() => {
    if (selectedPosition) {
      setFormData(prev => ({
        ...prev,
        latitude: selectedPosition.latitude,
        longitude: selectedPosition.longitude,
      }));
      
      // Clear position error if it exists
      if (errors.position) {
        setErrors(prev => ({ ...prev, position: '' }));
      }
    }
  }, [selectedPosition, errors.position]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Add New Location
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Location Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`form-input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Enter location name (e.g., Joe's Pizza)"
            disabled={isLoading}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Description field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="form-input"
            placeholder="Add any notes or description..."
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Added by field */}
        <div>
          <label htmlFor="addedBy" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name *
          </label>
          <input
            type="text"
            id="addedBy"
            value={formData.addedBy}
            onChange={(e) => handleInputChange('addedBy', e.target.value)}
            className={`form-input ${errors.addedBy ? 'border-red-500' : ''}`}
            placeholder="Enter your name"
            disabled={isLoading}
          />
          {errors.addedBy && <p className="text-red-500 text-sm mt-1">{errors.addedBy}</p>}
        </div>

        {/* Position info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">
            <strong>Selected Position:</strong>
          </p>
          {selectedPosition ? (
            <p className="text-sm text-gray-700">
              Latitude: {selectedPosition.latitude.toFixed(6)}, 
              Longitude: {selectedPosition.longitude.toFixed(6)}
            </p>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Click on the map to select a location
            </p>
          )}
          {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={isLoading || !selectedPosition}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </span>
            ) : (
              'Add Location'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLocationForm;
