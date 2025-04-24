import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

interface User {
    id: number;
    username: string;
    email: string;
}

interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string, email: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            authService.getCurrentUser()
                .then((userData: User) => {
                    setUser(userData);
                })
                .catch(() => {
                    setUser(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string, email: string) => {
        console.log('AuthContext: Starting login...');
        try{
            const data = await authService.login(username, password, email) as LoginResponse;
            console.log('AuthContext: Login response:', data);
            //get current user should be properly called here
            //waiting for user data
            const user = await authService.getCurrentUser();
            setUser(user);
            console.log('AuthContext: User state updated:', data.user); //undefined because there is no user data 
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        await authService.register(username, email, password);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { useAuth }; 