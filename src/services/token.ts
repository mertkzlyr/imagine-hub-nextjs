import { AUTH_CONFIG } from '@/config';

class TokenService {
    private static instance: TokenService;
    private token: string | null = null;

    private constructor() {
        // Only access storage in browser environment
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        }
    }

    public static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    public getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        }
        return this.token;
    }

    public setToken(token: string, rememberMe = true): void {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (rememberMe) {
                localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
                sessionStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            } else {
                sessionStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
                localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            }
        }
    }

    public removeToken(): void {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            sessionStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        }
    }

    public getAuthHeader(): { Authorization: string } | {} {
        return this.token ? { Authorization: `Bearer ${this.token}` } : {};
    }
}

export const tokenService = TokenService.getInstance(); 