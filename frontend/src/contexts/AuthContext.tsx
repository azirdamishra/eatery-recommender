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
    isAuthenticated: boolean;
    mustReauthenticate: boolean;
    login: (username: string, password: string, email: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    forceReauthentication: () => void;
    clearReauthenticationFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [mustReauthenticate, setMustReauthenticate] = useState(false);

    const loadUser = async () => {
        const token = localStorage.getItem('token');
        if (token && !mustReauthenticate) {
            try {
                const userData = await authService.getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.error('Error loading user:', error);
                localStorage.removeItem('token');
                setUser(null);
                setMustReauthenticate(true);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadUser();
    }, [mustReauthenticate]);

    const login = async (username: string, password: string, email: string) => {
        try {
            const data = await authService.login(username, password, email) as LoginResponse;
            localStorage.setItem('token', data.access_token);
            setMustReauthenticate(false); // Clear the reauthentication flag
            await loadUser();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        await authService.register(username, email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setMustReauthenticate(false); // Reset flag on explicit logout
    };

    const forceReauthentication = () => {
        setMustReauthenticate(true);
        setUser(null);
    };

    const clearReauthenticationFlag = () => {
        setMustReauthenticate(false);
    };

    const isAuthenticated = user !== null && !mustReauthenticate;

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            isAuthenticated,
            mustReauthenticate,
            login, 
            register, 
            logout,
            forceReauthentication,
            clearReauthenticationFlag
        }}>
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