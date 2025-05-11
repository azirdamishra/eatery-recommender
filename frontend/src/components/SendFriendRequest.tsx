import React, { useState } from 'react';
import { friendService } from '../services/friendService';

const SendFriendRequest: React.FC = () => {
    const [receiverId, setReceiverId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await friendService.sendFriendRequest(Number(receiverId));
            setSuccess('Friend request sent successfully!');
            setReceiverId('');
        } catch (err) {
            setError('Failed to send friend request. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Send Friend Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="receiverId" className="block text-sm font-medium text-gray-700">
                        User ID
                    </label>
                    <input
                        type="number"
                        id="receiverId"
                        value={receiverId}
                        onChange={(e) => setReceiverId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter user ID"
                        required
                    />
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && <div className="text-green-500 text-sm">{success}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {loading ? 'Sending...' : 'Send Friend Request'}
                </button>
            </form>
        </div>
    );
};

export default SendFriendRequest; 