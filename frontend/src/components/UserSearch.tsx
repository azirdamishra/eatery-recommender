import React, { useState } from 'react';
import axios from 'axios';

interface User {
    id: number;
    username: string;
    email: string;
}

interface UserSearchProps {
    onUserSelect: (userId: number) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/users/search`, {
                params: { query },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUsers(response.data);
        } catch (err) {
            setError('Failed to search users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchUsers(searchTerm);
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
                                <button
                                    onClick={() => onUserSelect(user.id)}
                                    className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    Add Friend
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </form>
        </div>
    );
};

export default UserSearch; 