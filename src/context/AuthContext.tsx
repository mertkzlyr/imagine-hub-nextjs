"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { userService, User } from '@/services/user';
import { authService } from '@/services/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            userService.getProfile().then((res) => {
                if (res.success && res.data) {
                    setUser(res.data);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }).catch(() => {
                setUser(null);
                setLoading(false);
            });
        } else {
            setUser(null);
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const res = await authService.login({ email, password });
            if (res.success && res.data && res.data.token) {
                localStorage.setItem('token', res.data.token);
                const profile = await userService.getProfile();
                if (profile.success && profile.data) {
                    setUser(profile.data);
                }
                setLoading(false);
                return true;
            } else {
                setLoading(false);
                return false;
            }
        } catch {
            setLoading(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 