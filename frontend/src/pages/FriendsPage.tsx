import React from 'react';
import { Link } from 'react-router-dom';
import FriendRequests from '../components/FriendRequests';
import SendFriendRequest from '../components/SendFriendRequest';
import UserSearch from '../components/UserSearch';

const FriendsPage: React.FC = () => {
    const handleUserSelect = (userId: number) => {
        // This will be handled by the SendFriendRequest component
        console.log('Selected user:', userId);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Friends</h1>
                <Link
                    to="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                    Back to Dashboard
                </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <UserSearch onUserSelect={handleUserSelect} />
                    <SendFriendRequest />
                </div>
                <div>
                    <FriendRequests />
                </div>
            </div>
        </div>
    );
};

export default FriendsPage; 