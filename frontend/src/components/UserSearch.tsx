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
    
    // Confirmation dialog state
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'add' | 'remove' | 'cancel';
        user: User;
    } | null>(null);
    
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

    // Handle keyboard events for confirmation dialog
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (showConfirmDialog) {
                if (event.key === 'Escape') {
                    handleConfirmClose();
                } else if (event.key === 'Enter' && confirmAction) {
                    handleConfirmAction();
                }
            }
        };

        if (showConfirmDialog) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when dialog is open
            document.body.style.overflow = 'hidden';
            
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'unset';
            };
        }
    }, [showConfirmDialog, confirmAction]);

    // Confirmation dialog handlers
    const showConfirmation = (type: 'add' | 'remove' | 'cancel', user: User) => {
        setConfirmAction({ type, user });
        setShowConfirmDialog(true);
    };

    const handleConfirmClose = () => {
        setShowConfirmDialog(false);
        setConfirmAction(null);
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) return;

        const { type, user } = confirmAction;
        
        // Validate user data for security
        if (!user || !user.id || typeof user.id !== 'number') {
            console.error('Invalid user data in confirmation action:', user);
            setError('Invalid user data. Please try again.');
            handleConfirmClose();
            return;
        }

        setShowConfirmDialog(false);
        setConfirmAction(null);

        try {
            // Execute the confirmed action
            switch (type) {
                case 'add':
                    await executeAddFriend(user.id);
                    break;
                case 'remove':
                    await executeRemoveFriend(user.id);
                    break;
                case 'cancel':
                    await executeCancelRequest(user.id);
                    break;
                default:
                    console.error('Unknown confirmation action type:', type);
                    setError('Unknown action type. Please try again.');
            }
        } catch (error) {
            console.error('Error executing confirmed action:', error);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    // Renamed original handlers to "execute" functions
    const executeAddFriend = async (userId: number) => {
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

    const executeRemoveFriend = async (userId: number) => {
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

    const executeCancelRequest = async (userId: number) => {
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
                        onClick={() => showConfirmation('remove', user)}
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
                        onClick={() => showConfirmation('cancel', user)}
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
                        onClick={() => showConfirmation('add', user)}
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
            
            {/* Confirmation Dialog */}
            {showConfirmDialog && confirmAction && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(e) => {
                        // Close dialog if clicking on backdrop
                        if (e.target === e.currentTarget) {
                            handleConfirmClose();
                        }
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-dialog-title"
                >
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                confirmAction.type === 'remove' 
                                    ? 'bg-red-100' 
                                    : confirmAction.type === 'cancel'
                                    ? 'bg-yellow-100'
                                    : 'bg-blue-100'
                            }`}>
                                {confirmAction.type === 'remove' && (
                                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {confirmAction.type === 'cancel' && (
                                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {confirmAction.type === 'add' && (
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 
                                    id="confirm-dialog-title"
                                    className="text-lg font-semibold text-gray-900"
                                >
                                    {confirmAction.type === 'remove' && 'Remove Friend'}
                                    {confirmAction.type === 'cancel' && 'Cancel Friend Request'}
                                    {confirmAction.type === 'add' && 'Add Friend'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {confirmAction.type === 'remove' && 
                                        `Are you sure you want to remove ${confirmAction.user.username} from your friends?`
                                    }
                                    {confirmAction.type === 'cancel' && 
                                        `Are you sure you want to cancel your friend request to ${confirmAction.user.username}?`
                                    }
                                    {confirmAction.type === 'add' && 
                                        `Do you want to send a friend request to ${confirmAction.user.username}?`
                                    }
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                        {confirmAction.user.username[0].toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {confirmAction.user.username}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {confirmAction.user.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleConfirmClose}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium ${
                                    confirmAction.type === 'remove'
                                        ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                                        : confirmAction.type === 'cancel'
                                        ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                                }`}
                            >
                                {confirmAction.type === 'remove' && 'Remove Friend'}
                                {confirmAction.type === 'cancel' && 'Cancel Request'}
                                {confirmAction.type === 'add' && 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
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