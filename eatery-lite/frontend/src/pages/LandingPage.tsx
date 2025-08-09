import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { CreateGroupRequest } from '../types';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsLoading(true);

    try {
      const groupData: CreateGroupRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      };

      const newGroup = await apiService.createGroup(groupData);
      
      // Navigate to the group page with the new group ID
      navigate(`/group/${newGroup.id}`);
    } catch (err: any) {
      console.error('Error creating group:', err);
      setError(err.response?.data?.detail || 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Eatery Lite
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Share locations with friends instantly. No sign-ups, no hassle – just create a group and start collaborating on your map.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Create a New Group
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Weekend Food Hunt"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="form-input"
                  placeholder="Tell your friends what this group is for..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="w-full btn-primary py-3 text-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Group...
                  </span>
                ) : (
                  'Create Group & Get Shareable Link'
                )}
              </button>
            </form>
          </div>

          {/* How it works */}
          <div className="mt-8 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-4">How it works</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span>Create a group with a name</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span>Share the unique URL with your friends</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <span>Everyone can add locations to the shared map</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
