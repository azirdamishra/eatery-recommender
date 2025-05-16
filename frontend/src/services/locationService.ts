import axios from "axios";

export interface Location{
    latitude: number;
    longitude: number;
}

export interface UserLocation extends Location{
    id: number;
    user_id: number;
    last_updated: string;
}

export interface Landmark extends Location{
    id: number;
    user_id: number;
    name: string;
    description?: string;
    locality?: string;
    created_at: string;
}

const API_URL = 'http://localhost:8000' //import.meta.env.VITE_API_URL || 'http://localhost:8000';

class LocationService{
    private static instance: LocationService;
    private baseURL = `${API_URL}/location`;

    private constructor() {}

    public static getInstance(): LocationService{
        if(!LocationService.instance){
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    private getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async updateCurrentLocation(location: Location): Promise<UserLocation>{
        const response = await axios.post(`${this.baseURL}/location`, location, { headers: this.getAuthHeader() });
        return response.data;
    }

    async getCurrentLocation(): Promise<UserLocation>{
        const response = await axios.get(`${this.baseURL}/location`, { headers: this.getAuthHeader() });
        return response.data;
    }

    async saveLandmark(landmark: Omit<Landmark, 'id' | 'user_id' | 'created_at'>): Promise<Landmark>{
        const response = await axios.post(`${this.baseURL}/landmarks`, landmark, { headers: this.getAuthHeader() });
        return response.data;
    }

    async getLandmarks(): Promise<Landmark[]>{
        const response = await axios.get(`${this.baseURL}/landmarks`, { headers: this.getAuthHeader() });
        return response.data;
    }

    async deleteLandmark(landmarkId: number): Promise<void> {
        await axios.delete(`${this.baseURL}/landmarks/${landmarkId}`, { headers: this.getAuthHeader() });
    }
}

export default LocationService.getInstance();