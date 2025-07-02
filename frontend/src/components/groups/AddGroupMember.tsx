import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { groupAdminService } from '../../services/groupAdminService';

interface Friend {
  id: number;
  username: string;
  email: string;
  is_member: boolean; // Whether they're already a member of this group
}

interface AddGroupMemberProps {
  groupId: number;
  currentMembers: number[]; // Array of user IDs who are already members
  onMemberAdded: () => void; // Callback to refresh group data
  onCancel: () => void; // Callback to close the component
}

const AddGroupMember: React.FC<AddGroupMemberProps> = ({
  groupId,
  currentMembers,
  onMemberAdded,
  onCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  
  // Refs for cleanup
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Search for friends who can be added to the group
  const searchFriends = useCallback(async (query: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setFriends([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get user's friends
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/friends/friends`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Filter friends by search term and exclude current members
      const friendsList = response.data.filter((friend: any) => 
        friend.username.toLowerCase().includes(query.toLowerCase()) ||
        friend.email.toLowerCase().includes(query.toLowerCase())
      );

      // Mark friends who are already members
      const friendsWithMemberStatus = friendsList.map((friend: any) => ({
        ...friend,
        is_member: currentMembers.includes(friend.id)
      }));

      setFriends(friendsWithMemberStatus);
      setHasSearched(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load friends';
      setError(errorMessage);
      setFriends([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, [currentMembers]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchTerm.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchFriends(searchTerm);
      }, 300);
    } else {
      setFriends([]);
      setHasSearched(false);
      setError(null);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, searchFriends]);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccess(null), 4000);
    }
  }, [success]);

  // Auto-clear error message
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(null), 6000);
    }
  }, [error]);

  // Handle keyboard events for dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showConfirmDialog) {
          setShowConfirmDialog(false);
          setSelectedFriend(null);
        } else {
          onCancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmDialog, onCancel]);

  const showAddConfirmation = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowConfirmDialog(true);
  };

  const handleAddMember = async () => {
    if (!selectedFriend) return;

    setShowConfirmDialog(false);
    setAddingMember(selectedFriend.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await groupAdminService.addMember(groupId, selectedFriend.id);
      setSuccess(response.message);
      
      // Update local state to mark friend as member
      setFriends(friends.map(friend => 
        friend.id === selectedFriend.id ? { ...friend, is_member: true } : friend
      ));
      
      // Notify parent to refresh group data
      onMemberAdded();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to add member';
      setError(errorMessage);
    } finally {
      setAddingMember(null);
      setSelectedFriend(null);
    }
  };

  const availableFriends = friends.filter(friend => !friend.is_member);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Add Group Member</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your friends..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Search for friends to add to this group. Only your friends can be added.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {/* Search Results */}
      {!loading && hasSearched && (
        <div className="space-y-3">
          {availableFriends.length > 0 ? (
            <>
              <div className="text-sm text-gray-600 mb-3">
                Found {availableFriends.length} friend{availableFriends.length !== 1 ? 's' : ''} available to add
              </div>
              {availableFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {friend.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{friend.username}</p>
                      <p className="text-xs text-gray-500">{friend.email}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => showAddConfirmation(friend)}
                    disabled={addingMember === friend.id}
                    className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingMember === friend.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add to Group
                      </>
                    )}
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 text-sm">
                {friends.length === 0 ? 'No friends found matching your search.' : 'All matching friends are already group members.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 text-sm">Start typing to search for friends to add to the group</p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Add Member to Group</h3>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedFriend.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFriend.username}</p>
                  <p className="text-xs text-gray-500">{selectedFriend.email}</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to add <strong>{selectedFriend.username}</strong> to this group? 
              They will be able to see all group activities and participate in discussions.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedFriend(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddGroupMember; 