export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    pagination: PaginationInfo;
}

export interface Comment {
    id: number;
    userId: number;
    username: string;
    profilePicture: string;
    comment: string;
    parentId: number | null;
    likeCount: number;
    createdAt: string;
    replies: Comment[];
}

export interface Post {
    id: string;
    userId: number;
    username: string;
    name: string;
    surname: string;
    profilePicture: string;
    description?: string;
    imageUrl: string;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
    createdAt: string;
}

export interface PostDetail extends Post {
    comments: Comment[];
}

export interface CreatePostDto {
    description: string;
    picture: File;
}

export interface UpdatePostDto {
    postId: string;
    description: string;
}

export interface CreateCommentDto {
    postId: string;
    comment: string;
    parentId?: string;
} 