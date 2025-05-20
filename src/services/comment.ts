import { API_CONFIG } from '@/config';
import { ApiResponse, Comment } from './types';

interface CreateCommentDto {
    postId: string;
    comment: string;
    parentId?: string;
}

interface UpdateCommentDto {
    commentId: string;
    comment: string;
}

class CommentService {
    private baseUrl = `${API_CONFIG.BASE_URL}/comment`;

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || 'Failed to fetch data');
        }
        return response.json();
    }

    async createComment(dto: CreateCommentDto): Promise<ApiResponse<Comment>> {
        try {
            const response = await fetch(`${this.baseUrl}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<null>>(response);
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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
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