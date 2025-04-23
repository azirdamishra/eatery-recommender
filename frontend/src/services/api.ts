import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

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

// interface RequestConfig {
//     headers?: {
//         Authorization?: string;
//         'Content-Type'?: string;
//     };
// }

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies if you switch to cookie-based auth
});

// Token management functions
const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
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
    (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
            if (isTokenExpired(token)) {
                // Handle token refresh synchronously
                api.post<RefreshTokenResponse>('/user/refresh-token')
                    .then(response => {
                        setAuthToken(response.data.access_token);
                        if (config.headers) {
                            config.headers.Authorization = `Bearer ${response.data.access_token}`;
                        }
                    })
                    .catch(() => {
                        setAuthToken(null);
                        window.location.href = '/login';
                    });
            } else {
                if (config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const response = await api.post<RefreshTokenResponse>('/user/refresh-token');
                setAuthToken(response.data.access_token);
                
                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                setAuthToken(null);
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const authService = {
    login: async (username: string, password: string, email: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/user/login', { username, password, email });
        if (response.data.access_token) {
            setAuthToken(response.data.access_token);
        }
        return response.data;
    },

    register: async (username: string, email: string, password: string) => {
        const response = await api.post('/user/register', { username, email, password });
        return response.data;
    },
    
    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>('/user/me');
        return response.data;
    },

    logout: () => {
        setAuthToken(null);
    }
};

export default api; 