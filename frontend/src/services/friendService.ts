import axios from "axios";

export interface User{
    id: number;
    username: string;
    email: string;
}

export interface FriendRequest{
    id: number;
    sender_id: number;
    receiver_id: number;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
}

const API_URL = 'http://localhost:8000'; // process.env.REACT_APP_API_URL || 'http://localhost:8000'

class FriendService{
    private getAuthHeader(){
        const token = localStorage.getItem('token');
        console.log('Current token:', token ? 'Token exists' : 'No token found');
        return token ? { Authorization: `Bearer ${token}`} : {};
    }

    async sendFriendRequest(receiverId: number): Promise<FriendRequest> {
        const response = await axios.post(
            `${API_URL}/friends/friend-requests`,
            { receiver_id: receiverId},
            {headers: this.getAuthHeader()}
        );
        return response.data;
    }

    async getFriendRequests(): Promise<FriendRequest[]>{
        const response = await axios.get(`${API_URL}/friends/friend-requests`,{
            headers: this.getAuthHeader(),
        });
        return response.data;
    }

    async updateFriendRequest(requestId: number, status: 'accepted' | 'declined'): Promise<FriendRequest>{
        const response = await axios.put(
            `${API_URL}/friends/friend-requests/${requestId}`,
            {status},
            { headers: this.getAuthHeader()}
        )
        return response.data;
    }

    async getFriends(): Promise<User[]>{
        console.log('Fetching friends...');
        const response = await axios.get(`${API_URL}/friends/friends`, {
            headers: this.getAuthHeader(),
        });
        console.log('Friends response:', response.data);
        return response.data;
    }
}

export const friendService = new FriendService();