import { API_CONFIG } from '@/config';

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export const followService = {
    async follow(followeeId: number) {
        const headers: Record<string, string> = {
            ...getAuthHeaders(),
            'accept': '*/*',
        };
        const res = await fetch(`${API_CONFIG.BASE_URL}/Follow/${followeeId}`, {
            method: 'POST',
            headers,
        });
        return res.json();
    },
    async unfollow(followeeId: number) {
        const headers: Record<string, string> = {
            ...getAuthHeaders(),
            'accept': '*/*',
        };
        const res = await fetch(`${API_CONFIG.BASE_URL}/Follow/${followeeId}`, {
            method: 'DELETE',
            headers,
        });
        return res.json();
    },
    async getFollowers(page = 1, pageSize = 10) {
        const headers: Record<string, string> = getAuthHeaders();
        const res = await fetch(`${API_CONFIG.BASE_URL}/Follow/followers?page=${page}&pageSize=${pageSize}`, {
            headers,
        });
        return res.json();
    },
    async getFollowing(page = 1, pageSize = 10) {
        const headers: Record<string, string> = getAuthHeaders();
        const res = await fetch(`${API_CONFIG.BASE_URL}/Follow/following?page=${page}&pageSize=${pageSize}`, {
            headers,
        });
        return res.json();
    },
}; 