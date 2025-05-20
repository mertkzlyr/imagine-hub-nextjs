import { API_CONFIG } from '@/config';
import { ApiResponse } from './types';

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

export const authService = {
    login: async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Login failed');
        return response.json();
    },

    register: async (request: RegisterRequest): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        Object.entries(request).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value);
            }
        });

        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Registration failed');
        return response.json();
    },
}; 