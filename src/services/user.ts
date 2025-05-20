import { ApiResponse } from './types';
import { API_CONFIG, IMAGE_CONFIG, AUTH_CONFIG } from '@/config';

export interface User {
    id: number;
    username: string;
    name: string;
    surname: string;
    city?: string;
    country?: string;
    createdAt: string;
    profilePicture?: string;
    postCount: number;
    followers: number;
    following: number;
    posts: Post[];
}

export interface Post {
    id: number;
    userId: number;
    username: string;
    name: string;
    surname: string;
    likeCount: number;
    commentCount: number;
    description: string;
    imageUrl: string;
    createdAt: string;
}

export interface UpdateUserDto {
    name?: string;
    surname?: string;
    middleName?: string;
    phoneNumber?: string;
    city?: string;
    state?: string;
    country?: string;
}

export interface UpdatePasswordDto {
    currentPassword: string;
    newPassword: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    return {
        ...API_CONFIG.HEADERS,
        Authorization: token ? `Bearer ${token}` : '',
    };
};

export const userService = {
    getProfile: async (): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/user`, {
            credentials: 'include',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch user profile');
        return response.json();
    },

    getByUsername: async (username: string): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/user/by-username/${username}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
    },

    updateProfile: async (updateDto: UpdateUserDto): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/user/update`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify(updateDto),
        });
        if (!response.ok) throw new Error('Failed to update user');
        return response.json();
    },

    updateProfilePicture: async (file: File): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await fetch(`${API_CONFIG.BASE_URL}/user/update-profile-picture`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Authorization: `Bearer ${localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)}`,
            },
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to update profile picture');
        return response.json();
    },

    updatePassword: async (dto: UpdatePasswordDto): Promise<ApiResponse<any>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/user/update-password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to update password');
        return response.json();
    },

    deleteAccount: async (password: string): Promise<ApiResponse<any>> => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/user/delete-account`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify(password),
        });
        if (!response.ok) throw new Error('Failed to delete account');
        return response.json();
    },
}; 