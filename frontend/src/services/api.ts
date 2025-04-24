import axios from 'axios';
//import type { AxiosRequestConfig }  from 'axios';
import { jwtDecode } from 'jwt-decode';

//type AxiosRequestConfig = typeof axios.AxiosRequestConfig;

const API_URL = 'http://localhost:8000/';

interface User {
    id: number;
    username: string;
    email: string;
}

interface DecodedToken {
    exp: number;
    sub: string;
}

interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

interface RefreshTokenResponse {
    access_token: string;
}

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies if you switch to cookie-based auth
});

// Token management functions
const setAuthToken = async (token: string | null) => {
    console.log('Setting auth token:', token);
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
        //if needed then wait a bit more to ensure token is set
        // await new Promise(resolve => setTimeout(resolve, 100));
    } else {
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
    }
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        return decoded.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

// Request interceptor for API calls
api.interceptors.request.use(
    async (config) => {
        console.log('Request interceptor called');
        console.log('Request config:', config);
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token);
        if (token) {
            if(isTokenExpired(token)){
                try{
                    //Skip interceptor for refresh token request
                    if(config.url === '/user/refresh-token'){
                        return config;
                    }

                    //Refresh token asynchronously
                    const response = await api.post<RefreshTokenResponse>('/user/refresh-token');
                    setAuthToken(response.data.access_token);

                    if(config.headers){
                        config.headers.Authorization = `Bearer ${response.data.access_token}`;
                    }
                } catch (error){
                    //Handle token refresh faliure
                    setAuthToken(null);
                    window.location.href = '/login';
                    throw error;
                }
            } else {
                if(config.headers){
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log('Response received:', response);
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            setAuthToken(null);
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (username: string, password: string, email: string): Promise<LoginResponse> => {
        console.log('Making login request...');
        const response = await api.post<LoginResponse>('/user/login', { username, password, email });
        console.log('Login response:', response);
        if (response.data.access_token) {
            await setAuthToken(response.data.access_token);
        }
        return response.data;
    },

    register: async (username: string, email: string, password: string) => {
        console.log('Making register request...');
        const response = await api.post('/user/register', { username, email, password });
        console.log('Register response:', response);
        return response.data;
    },
    
    getCurrentUser: async (): Promise<User> => {
        console.log('Making getCurrentUser request...');
        const response = await api.get<User>('/user/me');
        console.log('getCurrentUser response:', response);
        return response.data;
    },

    logout: () => {
        console.log('Logging out...');
        setAuthToken(null);
    }
};

export default api; 