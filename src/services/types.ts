export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PaginationInfo {
    from: number;
    to: number;
    total: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    pagination: PaginationInfo;
} 