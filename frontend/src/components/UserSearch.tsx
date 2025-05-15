import React, { useState } from 'react';
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

    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/user/search`, {
                params: { query },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log('Search results:', response.data);
            setUsers(response.data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to search users';
            setError(errorMessage);
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchUsers(searchTerm);
    };

    const handleAddFriend = async (userId: number) => {
        setError(null);
        setSuccess(null);
        try {
            await friendService.sendFriendRequest(userId);
            setSuccess('Friend request sent successfully!');
            // Update the user's status in the list
            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: 'request_sent' } : user
            ));
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to send friend request';
            setError(errorMessage);
            console.error('Error sending friend request:', err);
        }
    };

    const handleRemoveFriend = async (userId: number) => {
        setError(null);
        setSuccess(null);
        try {
            await friendService.removeFriend(userId);
            setSuccess('Friend removed successfully!');
            // Update the user's status in the list to show "Add Friend" button
            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: 'none' } : user
            ));
            // Notify parent component to refresh friends list
            onUserSelect(userId);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to remove friend';
            setError(errorMessage);
            console.error('Error removing friend:', err);
        }
    };

    const handleCancelRequest = async (userId: number) => {
        setError(null);
        setSuccess(null);
        try {
            await friendService.cancelFriendRequest(userId);
            setSuccess('Friend request cancelled successfully!');
            // Update the user's status in the list to show "Add Friend" button
            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: 'none' } : user
            ));
            // Notify parent component to refresh friends list
            onUserSelect(userId);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to cancel friend request';
            setError(errorMessage);
            console.error('Error cancelling friend request:', err);
        }
    };

    const renderActionButton = (user: User) => {
        switch (user.status) {
            case 'friend':
                return (
                    <button
                        onClick={() => handleRemoveFriend(user.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                        Remove Friend
                    </button>
                );
            case 'request_sent':
                return (
                    <button
                        onClick={() => handleCancelRequest(user.id)}
                        className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-800"
                    >
                        Cancel Request
                    </button>
                );
            case 'request_received':
                return (
                    <span className="px-3 py-1 text-sm text-gray-500">
                        Request Received
                    </span>
                );
            default:
                return (
                    <button
                        onClick={() => handleAddFriend(user.id)}
                        className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                        Add Friend
                    </button>
                );
        }
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Find Users</h2>
            <form onSubmit={handleSearch} className="space-y-4">
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                        Search by username or email
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="text"
                            id="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter username or email"
                        />
                        <button
                            type="submit"
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && <div className="text-green-500 text-sm">{success}</div>}

                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="flex justify-between items-center p-3 bg-white rounded-lg shadow"
                            >
                                <div>
                                    <p className="font-medium">{user.username}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                                {renderActionButton(user)}
                            </div>
                        ))}
                    </div>
                )}
            </form>
        </div>
    );
};

export default UserSearch; 