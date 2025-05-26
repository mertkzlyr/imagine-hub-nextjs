import { API_CONFIG } from '@/config';
import { ApiResponse } from './types';
import { tokenService } from './token';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    name: string;
    surname: string;
    middleName?: string;
    email: string;
    password: string;
    phoneNumber?: string;
    city?: string;
    state?: string;
    country?: string;
    profilePicture?: File;
}

export interface LoginResponse {
    token: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export const authService = {
    login: async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                ...API_CONFIG.HEADERS,
            },
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Login failed');
        const data = await response.json();
        if (data.success && data.data?.token) {
            tokenService.setToken(data.data.token);
        }
        return data;
    },

    register: async (request: RegisterRequest | FormData): Promise<ApiResponse<any>> => {
        let body: FormData;
        if (request instanceof FormData) {
            body = request;
        } else {
            body = new FormData();
            Object.entries(request).forEach(([key, value]) => {
                if (value !== undefined) {
                    body.append(key, value);
                }
            });
        }
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
            method: 'POST',
            body,
        });
        if (!response.ok) throw new Error('Registration failed');
        return response.json();
    },

    forgotPassword: async (request: ForgotPasswordRequest): Promise<ApiResponse<any>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/User/forgot-password`, {
            method: 'POST',
            headers: {
                ...API_CONFIG.HEADERS,
            },
            body: JSON.stringify(request),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to send reset link');
        }
        return data;
    },

    resetPassword: async (request: ResetPasswordRequest): Promise<ApiResponse<any>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/User/reset-password`, {
            method: 'POST',
            headers: {
                ...API_CONFIG.HEADERS,
            },
            body: JSON.stringify(request),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to reset password');
        }
        return data;
    },

    logout: () => {
        tokenService.removeToken();
    }
}; 