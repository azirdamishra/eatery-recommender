import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { friendService } from '../services/friendService';

interface User {
    id: number;
    username: string;
    email: string;
    status: 'none' | 'friend' | 'request_sent' | 'request_received';
}

interface UserSearchProps {
    onUserSelect: (userId: number) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loadingActions, setLoadingActions] = useState<Set<number>>(new Set());
    const [hasSearched, setHasSearched] = useState(false); // Track if we've actually performed a search
    
    // Refs to track timeouts for cleanup
    const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For debounced search

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const searchUsers = useCallback(async (query: string) => {
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!query.trim()) {
            setUsers([]);
            setHasSearched(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/user/search`, {
                params: { query: query.trim() },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log('Search results:', response.data);
            setUsers(response.data);
            setHasSearched(true);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to search users';
            setError(errorMessage);
            console.error('Search error:', err);
            setUsers([]);
            setHasSearched(true);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search effect - search as user types with 300ms delay
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm.trim()) {
            searchTimeoutRef.current = setTimeout(() => {
                searchUsers(searchTerm);
            }, 300); // 300ms debounce delay
        } else {
            // Clear results immediately when search term is empty
            setUsers([]);
            setHasSearched(false);
            setError(null);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, searchUsers]);

    const handleAddFriend = async (userId: number) => {
        setError(null);
        setSuccess(null);
        
        // Set loading state for this specific user
        setLoadingActions(prev => new Set(prev).add(userId));
        
        // Optimistically update UI immediately for smooth experience
        setUsers(users.map(user => 
            user.id === userId ? { ...user, status: 'request_sent' } : user
        ));

        try {
            await friendService.sendFriendRequest(userId);
            setSuccess('Friend request sent successfully!');
            
            // Clear success message after 3 seconds for better UX
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
            successTimeoutRef.current = setTimeout(() => setSuccess(null), 3000);
            
        } catch (err: any) {
            // Revert optimistic update on error
            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: 'none' } : user
            ));
            
            const errorMessage = err.response?.data?.detail || 'Failed to send friend request';
            setError(errorMessage);
            console.error('Error sending friend request:', err);
            
            // Clear error message after 5 seconds
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
            errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
        } finally {
            // Clear loading state
            setLoadingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const handleRemoveFriend = async (userId: number) => {
        setError(null);
        setSuccess(null);
        
        // Set loading state for this specific user
        setLoadingActions(prev => new Set(prev).add(userId));
        
        // Optimistically update UI immediately
        setUsers(users.map(user => 
            user.id === userId ? { ...user, status: 'none' } : user
        ));

        try {
            await friendService.removeFriend(userId);
            setSuccess('Friend removed successfully!');
            
            // Notify parent to refresh friends list (but only after successful operation)
            onUserSelect(userId);
            
            // Clear success message after 3 seconds
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
            successTimeoutRef.current = setTimeout(() => setSuccess(null), 3000);
            
        } catch (err: any) {
            // Revert optimistic update on error
            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: 'friend' } : user
            ));
            
            const errorMessage = err.response?.data?.detail || 'Failed to remove friend';
            setError(errorMessage);
            console.error('Error removing friend:', err);
            
            // Clear error message after 5 seconds
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
            errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
        } finally {
            // Clear loading state
            setLoadingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const handleCancelRequest = async (userId: number) => {
        setError(null);
        setSuccess(null);
        
        // Set loading state for this specific user
        setLoadingActions(prev => new Set(prev).add(userId));
        
        // Optimistically update UI immediately
        setUsers(users.map(user => 
            user.id === userId ? { ...user, status: 'none' } : user
        ));

        try {
            await friendService.cancelFriendRequest(userId);
            setSuccess('Friend request cancelled successfully!');
            
            // Clear success message after 3 seconds
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
            successTimeoutRef.current = setTimeout(() => setSuccess(null), 3000);
            
        } catch (err: any) {
            // Revert optimistic update on error
            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: 'request_sent' } : user
            ));
            
            const errorMessage = err.response?.data?.detail || 'Failed to cancel friend request';
            setError(errorMessage);
            console.error('Error cancelling friend request:', err);
            
            // Clear error message after 5 seconds
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
            errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
        } finally {
            // Clear loading state
            setLoadingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const renderActionButton = (user: User) => {
        const isLoading = loadingActions.has(user.id);
        
        const baseButtonClass = "px-3 py-1 text-sm font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
        
        switch (user.status) {
            case 'friend':
                return (
                    <button
                        onClick={() => handleRemoveFriend(user.id)}
                        disabled={isLoading}
                        className={`${baseButtonClass} text-red-600 hover:text-white hover:bg-red-600`}
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Removing...</span>
                            </div>
                        ) : (
                            'Remove Friend'
                        )}
                    </button>
                );
            case 'request_sent':
                return (
                    <button
                        onClick={() => handleCancelRequest(user.id)}
                        disabled={isLoading}
                        className={`${baseButtonClass} text-yellow-600 hover:text-white hover:bg-yellow-600`}
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Cancelling...</span>
                            </div>
                        ) : (
                            'Cancel Request'
                        )}
                    </button>
                );
            case 'request_received':
                return (
                    <span className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded">
                        Request Received
                    </span>
                );
            default:
                return (
                    <button
                        onClick={() => handleAddFriend(user.id)}
                        disabled={isLoading}
                        className={`${baseButtonClass} text-indigo-600 hover:text-white hover:bg-indigo-600`}
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Sending...</span>
                            </div>
                        ) : (
                            'Add Friend'
                        )}
                    </button>
                );
        }
    };

    return (
        <>
            <div className="w-full">
                <h2 className="text-2xl font-bold mb-4">Find Users</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                            Search by username or email
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => {
                                    // Clear any previous errors when user focuses
                                    if (error) setError(null);
                                }}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                placeholder="Start typing to search for users..."
                            />
                            {searchTerm && (
                                <p className="mt-1 text-xs text-gray-500">
                                    {loading ? 'Searching...' : `Type to search • ${users.length} result${users.length !== 1 ? 's' : ''} found`}
                                </p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm transition-all duration-300 fade-in">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm transition-all duration-300 fade-in">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{success}</span>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center space-x-2">
                                <div className="w-4 h-4 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-600">Searching users...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {users.map((user) => {
                                const isLoading = loadingActions.has(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        className={`flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm transition-all duration-300 ${
                                            isLoading ? 'scale-[0.98] opacity-80' : 'scale-100 opacity-100 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{user.username}</p>
                                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                            {user.status === 'request_sent' && (
                                                <p className="text-xs text-yellow-600 mt-1">Request pending</p>
                                            )}
                                            {user.status === 'friend' && (
                                                <p className="text-xs text-green-600 mt-1">Friends</p>
                                            )}
                                            {user.status === 'request_received' && (
                                                <p className="text-xs text-blue-600 mt-1">Sent you a request</p>
                                            )}
                                        </div>
                                        <div className="ml-3 flex-shrink-0">
                                            {renderActionButton(user)}
                                        </div>
                                    </div>
                                );
                            })}
                            {hasSearched && users.length === 0 && searchTerm.trim() && !loading && (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="text-sm">No users found matching "<strong>{searchTerm}</strong>"</p>
                                    <p className="text-xs text-gray-400 mt-1">Try a different username or email</p>
                                </div>
                            )}
                            {!hasSearched && !searchTerm.trim() && !loading && (
                                <div className="text-center py-8 text-gray-400">
                                    <svg className="w-12 h-12 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-sm">Start typing to find users</p>
                                    <p className="text-xs mt-1">Search by username or email address</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* CSS Animation Styles */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
};

export default UserSearch; 