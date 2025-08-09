import axios from 'axios';
import { Group, CreateGroupRequest, CreateLocationRequest, Location } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Create a new group
  createGroup: async (group: CreateGroupRequest): Promise<Group> => {
    const response = await api.post<Group>('/groups', group);
    return response.data;
  },

  // Get group details with all locations
  getGroup: async (groupId: string): Promise<Group> => {
    const response = await api.get<Group>(`/groups/${groupId}`);
    return response.data;
  },

  // Add a location to a group
  addLocation: async (groupId: string, location: CreateLocationRequest): Promise<Location> => {
    const response = await api.post<Location>(`/groups/${groupId}/locations`, location);
    return response.data;
  },

  // Remove a location from a group
  removeLocation: async (groupId: string, locationId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}/locations/${locationId}`);
  },
};

export default api;
