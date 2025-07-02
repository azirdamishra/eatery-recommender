import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FriendRequests from '../components/FriendRequests';
import UserSearch from '../components/UserSearch';
import { useAuth } from '../contexts/AuthContext';

const FriendsPage: React.FC = () => {
    const { user } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUserSelect = () => {
        // Trigger a refresh of the friends list
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Friends</h1>
                    <p className="text-gray-600 mt-1">Welcome, {user?.username}!</p>
                </div>
                <Link
                    to="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                    Back to Dashboard
                </Link>
            </div>
            
            <div className="space-y-8">
                {/* User Search Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <UserSearch onUserSelect={handleUserSelect} />
                </div>

                {/* Friend Requests and Friends List */}
                <div>
                    <FriendRequests key={refreshKey} />
                </div>
            </div>
        </div>
    );
};

export default FriendsPage; 