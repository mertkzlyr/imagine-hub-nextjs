import { API_CONFIG } from '@/config';
import { ApiResponse, Comment, CreateCommentDto } from './types';
import { tokenService } from './token';
import { handleApi401 } from './api401';

interface UpdateCommentDto {
    commentId: string;
    comment: string;
}

class CommentService {
    private baseUrl = `${API_CONFIG.BASE_URL}/Comment`;

    private async handleResponse<T>(response: Response): Promise<T> {
        try {
            if (!response.ok) {
                if (handleApi401(response)) {
                    // Return a standard error response for 401
                    return { success: false, message: 'You need to log in to continue.' } as T;
                }
                const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
                // Don't throw error for "already liked" case
                if (errorData.message?.toLowerCase().includes('already liked')) {
                    return { success: false, message: errorData.message } as T;
                }
                console.error('API Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData
                });
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in handleResponse:', error);
            throw error;
        }
    }

    async createComment(dto: CreateCommentDto): Promise<ApiResponse<Comment>> {
        try {
            const response = await fetch(`${this.baseUrl}/comment`, {
                method: 'POST',
                headers: {
                    ...API_CONFIG.HEADERS,
                    ...tokenService.getAuthHeader(),
                },
                body: JSON.stringify(dto),
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<Comment>>(response);
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    }

    async deleteComment(commentId: string): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${this.baseUrl}/${commentId}`, {
                method: 'DELETE',
                headers: {
                    ...API_CONFIG.HEADERS,
                    ...tokenService.getAuthHeader(),
                },
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<null>>(response);
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    }

    async updateComment(dto: UpdateCommentDto): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'PUT',
                headers: {
                    ...API_CONFIG.HEADERS,
                    ...tokenService.getAuthHeader(),
                },
                body: JSON.stringify(dto),
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<null>>(response);
        } catch (error) {
            console.error('Error updating comment:', error);
            throw error;
        }
    }

    async likeComment(commentId: string): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${this.baseUrl}/${commentId}/like`, {
                method: 'POST',
                headers: {
                    ...API_CONFIG.HEADERS,
                    ...tokenService.getAuthHeader(),
                },
                credentials: 'include'
            });
            const data = await this.handleResponse<ApiResponse<null>>(response);

            // If the comment is already liked, call unlike endpoint
            if (!data.success && data.message?.toLowerCase().includes('already liked')) {
                return this.unlikeComment(commentId);
            }

            return data;
        } catch (error) {
            console.error('Error liking comment:', error);
            throw error;
        }
    }

    async unlikeComment(commentId: string): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${this.baseUrl}/${commentId}/like`, {
                method: 'DELETE',
                headers: {
                    ...API_CONFIG.HEADERS,
                    ...tokenService.getAuthHeader(),
                },
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<null>>(response);
        } catch (error) {
            console.error('Error unliking comment:', error);
            throw error;
        }
    }
}

export const commentService = new CommentService(); 