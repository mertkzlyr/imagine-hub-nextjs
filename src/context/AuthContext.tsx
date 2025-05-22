"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { userService, User } from '@/services/user';
import { authService } from '@/services/auth';
import { tokenService } from '@/services/token';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = tokenService.getToken();
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

    const login = async (email: string, password: string, rememberMe = true) => {
        setLoading(true);
        try {
            const res = await authService.login({ email, password });
            if (res.success && res.data && res.data.token) {
                tokenService.setToken(res.data.token, rememberMe);
                const profile = await userService.getProfile();
                if (profile.success && profile.data) {
                    setUser(profile.data);
                    // Save userId to correct storage for comment ownership
                    if (typeof window !== 'undefined') {
                        if (rememberMe) {
                            localStorage.setItem('userId', profile.data.id.toString());
                            sessionStorage.removeItem('userId');
                        } else {
                            sessionStorage.setItem('userId', profile.data.id.toString());
                            localStorage.removeItem('userId');
                        }
                    }
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
        tokenService.removeToken();
        setUser(null);
        // Remove userId from both storages
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userId');
            sessionStorage.removeItem('userId');
        }
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