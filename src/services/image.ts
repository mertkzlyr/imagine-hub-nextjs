import { API_CONFIG } from '@/config';
import { ApiResponse } from './types';
import { tokenService } from './token';

class ImageService {
    private baseUrl = `${API_CONFIG.BASE_URL}/Image`;

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async getGenerationTokens(): Promise<ApiResponse<number>> {
        const response = await fetch(`${this.baseUrl}/generation-tokens`, {
            headers: {
                ...API_CONFIG.HEADERS,
                ...tokenService.getAuthHeader(),
            },
        });
        return this.handleResponse<ApiResponse<number>>(response);
    }

    async generateImage(prompt: string): Promise<ApiResponse<any>> {
        const response = await fetch(`${this.baseUrl}/generate-image`, {
            method: 'POST',
            headers: {
                ...API_CONFIG.HEADERS,
                ...tokenService.getAuthHeader(),
            },
            body: JSON.stringify({ prompt }),
        });
        return this.handleResponse<ApiResponse<any>>(response);
    }

    async getImages(page = 1, pageSize = 12): Promise<ApiResponse<any[]>> {
        const response = await fetch(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`, {
            headers: {
                ...API_CONFIG.HEADERS,
                ...tokenService.getAuthHeader(),
            },
        });
        return this.handleResponse<ApiResponse<any[]>>(response);
    }

    async getImageById(id: string): Promise<ApiResponse<any>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            headers: {
                ...API_CONFIG.HEADERS,
                ...tokenService.getAuthHeader(),
            },
        });
        return this.handleResponse<ApiResponse<any>>(response);
    }

    async uploadProfilePicture(file: File): Promise<ApiResponse<string>> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/upload-profile-picture`, {
            method: 'POST',
            headers: {
                ...tokenService.getAuthHeader(),
            },
            body: formData,
        });
        return this.handleResponse<ApiResponse<string>>(response);
    }
}

export const imageService = new ImageService(); 