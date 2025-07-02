import axios, { AxiosInstance, AxiosError } from "axios";

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
    created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class LocationService{
    private static instance: LocationService;
    private baseURL = `${API_URL}/location`;
    private axiosInstance: AxiosInstance;

    private constructor() {
        // Create axios instance with default config
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                console.error('Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                console.error('API Error:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    url: error.config?.url,
                    method: error.config?.method
                });

                // Handle specific error cases
                if (error.response?.status === 401) {
                    // Token might be expired, redirect to login
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }

                return Promise.reject(error);
            }
        );
    }

    public static getInstance(): LocationService{
        if(!LocationService.instance){
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    private validateLocation(location: Location): void {
        if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
            throw new Error('Invalid location data');
        }
        
        if (location.latitude < -90 || location.latitude > 90) {
            throw new Error('Invalid latitude: must be between -90 and 90');
        }
        
        if (location.longitude < -180 || location.longitude > 180) {
            throw new Error('Invalid longitude: must be between -180 and 180');
        }
    }

    private validateLandmark(landmark: Omit<Landmark, 'id' | 'user_id' | 'created_at'>): void {
        if (!landmark || !landmark.name || landmark.name.trim().length === 0) {
            throw new Error('Landmark name is required');
        }
        
        if (landmark.name.length > 255) {
            throw new Error('Landmark name is too long (max 255 characters)');
        }
        
        if (landmark.description && landmark.description.length > 1000) {
            throw new Error('Landmark description is too long (max 1000 characters)');
        }
        
        this.validateLocation(landmark);
    }

    async updateCurrentLocation(location: Location): Promise<UserLocation>{
        try {
            this.validateLocation(location);
            const response = await this.axiosInstance.post('/location', location);
            return response.data;
        } catch (error) {
            console.error('Error updating current location:', error);
            throw error;
        }
    }

    async getCurrentLocation(): Promise<UserLocation>{
        try {
            const response = await this.axiosInstance.get('/location');
            return response.data;
        } catch (error) {
            console.error('Error getting current location:', error);
            throw error;
        }
    }

    async saveLandmark(landmark: Omit<Landmark, 'id' | 'user_id' | 'created_at'>): Promise<Landmark>{
        try {
            this.validateLandmark(landmark);
            const response = await this.axiosInstance.post('/landmarks', {
                ...landmark,
                name: landmark.name.trim(),
                description: landmark.description?.trim() || undefined
            });
            return response.data;
        } catch (error) {
            console.error('Error saving landmark:', error);
            throw error;
        }
    }

    async getLandmarks(): Promise<Landmark[]>{
        try {
            const response = await this.axiosInstance.get('/landmarks');
            const landmarks = response.data;
            
            // Validate response data
            if (!Array.isArray(landmarks)) {
                throw new Error('Invalid response: expected array of landmarks');
            }
            
            // Log for debugging
            console.log('🔍 LocationService.getLandmarks() response:', landmarks);
            
            return landmarks;
        } catch (error) {
            console.error('Error getting landmarks:', error);
            throw error;
        }
    }

    async deleteLandmark(landmarkId: number): Promise<void> {
        try {
            if (!landmarkId || landmarkId <= 0) {
                throw new Error('Invalid landmark ID');
            }
            
            await this.axiosInstance.delete(`/landmarks/${landmarkId}`);
        } catch (error) {
            console.error('Error deleting landmark:', error);
            throw error;
        }
    }

    // Health check method
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.axiosInstance.get('/health');
            return response.status === 200;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}

export default LocationService.getInstance();