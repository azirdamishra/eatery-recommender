import React, { useEffect, useState } from 'react';
import { friendService, FriendRequest, User } from '../services/friendService';
import { useAuth } from '../contexts/AuthContext';

const FriendRequests: React.FC = () => {
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        loadFriendRequests();
        loadFriends();
    }, []);

    const loadFriendRequests = async () => {
        try {
            const requests = await friendService.getFriendRequests();
            // Filter to only show pending requests sent TO the current user
            const incomingRequests = requests.filter(request => 
                request.receiver_id === user?.id && 
                request.status === 'pending'
            );
            setFriendRequests(incomingRequests);
        } catch (err) {
            setError('Failed to load friend requests');
            console.error(err);
        }
    };

    const loadFriends = async () => {
        try {
            console.log('Loading friends for user:', user?.id);
            const friendsList = await friendService.getFriends();
            console.log('Friends list received:', friendsList);
            if (!Array.isArray(friendsList)) {
                console.error('Friends list is not an array:', friendsList);
                setError('Invalid friends data received');
                return;
            }
            setFriends(friendsList);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to load friends';
            setError(errorMessage);
            console.error('Error loading friends:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId: number) => {
        try {
            await friendService.acceptFriendRequest(requestId);
            await loadFriendRequests();
            await loadFriends();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to accept friend request';
            setError(errorMessage);
            console.error('Error accepting friend request:', err);
        }
    };

    const handleDeclineRequest = async (requestId: number) => {
        try {
            await friendService.declineFriendRequest(requestId);
            await loadFriendRequests();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to decline friend request';
            setError(errorMessage);
            console.error('Error declining friend request:', err);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Friend Requests</h2>
                {friendRequests.length === 0 ? (
                    <p className="text-gray-500">No pending friend requests</p>
                ) : (
                    <div className="space-y-4">
                        {friendRequests.map((request) => (
                            <div key={request.id} className="bg-white p-4 rounded-lg shadow">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">Request from {request.sender_username}</p>
                                        <p className="text-sm text-gray-500">
                                            Sent on: {new Date(request.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {request.status === 'pending' && (
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => handleAcceptRequest(request.id)}
                                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDeclineRequest(request.id)}
                                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Friends</h2>
                {friends.length === 0 ? (
                    <p className="text-gray-500">No friends yet</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {friends.map((friend) => (
                            <div key={friend.id} className="bg-white p-4 rounded-lg shadow">
                                <h3 className="font-semibold">{friend.username}</h3>
                                <p className="text-sm text-gray-500">{friend.email}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendRequests; 