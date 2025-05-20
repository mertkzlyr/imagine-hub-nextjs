// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169/api',
    TIMEOUT: 30000, // 30 seconds
    HEADERS: {
        'Content-Type': 'application/json',
    },
} as const;

// Image URLs
export const IMAGE_CONFIG = {
    // The API serves static files from wwwroot directory
    PROFILE_PICTURE_URL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169'}/profile_pics`,
    POST_PICTURE_URL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169'}/post_pics`,
    DEFAULT_PROFILE_PICTURE: 'default.jpg',
    // File extensions supported by the application
    SUPPORTED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const,
    // Maximum file size in bytes (e.g., 5MB)
    MAX_FILE_SIZE: 5 * 1024 * 1024,
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 12,
    DEFAULT_PAGE: 1,
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
    TOKEN_KEY: 'auth_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
} as const; 