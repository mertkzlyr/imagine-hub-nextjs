import { API_CONFIG } from '@/config';
import { ApiResponse, CreatePostDto, PaginatedResponse, Post, PostDetail, UpdatePostDto } from './types';
import { handleApi401 } from './api401';

class PostService {
    private baseUrl = `${API_CONFIG.BASE_URL}/post`;

    private async handleResponse<T>(response: Response): Promise<T> {
        try {
            if (!response.ok) {
                if (handleApi401(response)) {
                    // Return a standard error response for 401
                    return { success: false, message: 'You need to log in to continue.' } as T;
                }
                const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
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

    async getAllPosts(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Post[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/posts?page=${page}&pageSize=${pageSize}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            return this.handleResponse<PaginatedResponse<Post[]>>(response);
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    }

    async getUserPosts(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Post[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/user/posts?page=${page}&pageSize=${pageSize}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            return this.handleResponse<PaginatedResponse<Post[]>>(response);
        } catch (error) {
            console.error('Error fetching user posts:', error);
            throw error;
        }
    }

    async createPost(createPostDto: CreatePostDto): Promise<ApiResponse<Post>> {
        try {
            const formData = new FormData();
            formData.append('description', createPostDto.description);
            if (createPostDto.picture) {
                formData.append('picture', createPostDto.picture);
            }

            const response = await fetch(`${this.baseUrl}/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData,
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<Post>>(response);
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }

    async getPostById(id: string): Promise<ApiResponse<PostDetail>> {
        try {
            const response = await fetch(`${this.baseUrl}/posts/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<PostDetail>>(response);
        } catch (error) {
            console.error('Error fetching post:', error);
            throw error;
        }
    }

    async likePost(postId: string): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${this.baseUrl}/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<null>>(response);
        } catch (error) {
            console.error('Error liking post:', error);
            throw error;
        }
    }

    async unlikePost(postId: string): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${this.baseUrl}/posts/${postId}/like`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<null>>(response);
        } catch (error) {
            console.error('Error unliking post:', error);
            throw error;
        }
    }

    async updateDescription(updatePostDto: UpdatePostDto): Promise<ApiResponse<Post>> {
        try {
            const response = await fetch(`${this.baseUrl}/update-description`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatePostDto),
                credentials: 'include'
            });
            return this.handleResponse<ApiResponse<Post>>(response);
        } catch (error) {
            console.error('Error updating post description:', error);
            throw error;
        }
    }
}

export const postService = new PostService(); 