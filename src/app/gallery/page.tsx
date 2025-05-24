'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { postService } from '@/services/post';
import { commentService } from '@/services/comment';
import { Post, PostDetail, Comment } from '@/services/types';
import Image from 'next/image';
import { IMAGE_CONFIG } from '@/config';
import Modal from '@/components/Modal';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import PostModal from '@/components/PostModal';
import { imageService } from '@/services/image';
import { API_CONFIG } from "@/config";
import AuthenticatedImage from '@/components/AuthenticatedImage';

export default function Gallery() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [visibleComments, setVisibleComments] = useState(3); // Show first 3 comments initially
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const observer = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateDescription, setUpdateDescription] = useState('');
    const [images, setImages] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pageSize, setPageSize] = useState(10);

    // Example: get current user ID (replace with your actual logic)
    const currentUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : null;

    useEffect(() => {
        const search = searchParams.get('search');
        if (search !== searchQuery) {
            setSearchQuery(search || '');
            setPosts([]);
            setCurrentPage(1);
            setTotalPages(1);
            setLoading(true);
        }
    }, [searchParams, searchQuery]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await postService.getAllPosts(1, 10, searchQuery);
                if (response.success && response.data) {
                    setPosts(response.data ?? []);
                    setCurrentPage(response.pagination?.currentPage || 1);
                    setTotalPages(response.pagination?.totalPages || 1);
                }
            } catch (error) {
                setError('Failed to load posts');
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [searchQuery]);

    const fetchMorePosts = useCallback(async () => {
        if (isFetching || loadingMore || currentPage >= totalPages) return;
        setIsFetching(true);
        setLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const response = await postService.getAllPosts(nextPage, 10, searchQuery);
            if (response.success && response.data) {
                setPosts(prev => [...prev, ...(response.data ?? [])]);
                setCurrentPage(response.pagination?.currentPage || nextPage);
                setTotalPages(response.pagination?.totalPages || totalPages);
            }
        } catch (error) {
            setError('Failed to load more posts');
        } finally {
            setLoadingMore(false);
            setIsFetching(false);
        }
    }, [isFetching, loadingMore, currentPage, totalPages, searchQuery]);

    useEffect(() => {
        if (loading) return;
        if (currentPage >= totalPages) return;
        const node = loadMoreRef.current;
        if (!node) return;
        let didCancel = false;
        const observer = new window.IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !didCancel && !isFetching && !loadingMore && currentPage < totalPages) {
                fetchMorePosts();
            }
        }, { rootMargin: '200px' }); // Trigger a bit before the bottom
        observer.observe(node);
        return () => {
            didCancel = true;
            observer.disconnect();
        };
    }, [fetchMorePosts, loading, loadingMore, isFetching, currentPage, totalPages, posts]);

    const handlePostClick = async (postId: string) => {
        try {
            setError(null); // Clear any previous errors
            const response = await postService.getPostById(postId);
            if (response.success && response.data) {
                setSelectedPost(response.data);
            } else {
                setError(response.message || 'Failed to load post details');
            }
        } catch (error) {
            console.error('Error fetching post details:', error);
            setError(error instanceof Error ? error.message : 'Failed to load post details');
        }
    };

    const handleCreateComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPost || !newComment.trim()) return;
        try {
            const response = await commentService.createComment({
                postId: selectedPost.id,
                comment: newComment.trim()
            });
            if (response.success) {
                const updatedPost = await postService.getPostById(selectedPost.id);
                if (updatedPost.success && updatedPost.data) {
                    setSelectedPost(updatedPost.data);
                }
                setNewComment('');
            } else if (response.message === 'You need to log in to continue.') {
                showToast('You must be logged in to comment.', 'error');
            } else {
                showToast('Failed to create comment', 'error');
            }
        } catch (error) {
            showToast('Failed to create comment', 'error');
        }
    };

    const handleReplySubmit = async (parentId: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPost || !replyText.trim()) return;
        try {
            const response = await commentService.createComment({
                postId: selectedPost.id,
                comment: replyText.trim(),
                parentId,
            });
            if (response.success) {
                const updatedPost = await postService.getPostById(selectedPost.id);
                if (updatedPost.success && updatedPost.data) {
                    setSelectedPost(updatedPost.data);
                }
                setReplyText('');
                setReplyingTo(null);
            } else if (response.message === 'You need to log in to continue.') {
                showToast('You must be logged in to comment.', 'error');
            } else {
                showToast('Failed to reply to comment', 'error');
            }
        } catch (error) {
            showToast('Failed to reply to comment', 'error');
        }
    };

    const handleLikePost = async () => {
        if (!selectedPost) return;
        // Optimistic update
        const wasLiked = selectedPost.isLikedByCurrentUser;
        setSelectedPost({ ...selectedPost, isLikedByCurrentUser: !wasLiked, likeCount: selectedPost.likeCount + (wasLiked ? -1 : 1) });
        setError(null);
        try {
            if (wasLiked) {
                // Unlike
                const response = await postService.unlikePost(selectedPost.id);
                if (!response.success) {
                    // If already unliked, try to like
                    if (response.message?.toLowerCase().includes('not liked')) {
                        await postService.likePost(selectedPost.id);
                    } else {
                        setError(response.message || 'Failed to unlike post');
                    }
                }
            } else {
                // Like
                const response = await postService.likePost(selectedPost.id);
                if (!response.success) {
                    // If already liked, try to unlike
                    if (response.message?.toLowerCase().includes('already liked')) {
                        await postService.unlikePost(selectedPost.id);
                    } else {
                        setError(response.message || 'Failed to like post');
                    }
                }
            }
            // Sync with backend
            const updatedPost = await postService.getPostById(selectedPost.id);
            if (updatedPost.success && updatedPost.data) {
                setSelectedPost(updatedPost.data);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update like');
        }
    };

    const handleLikeComment = async (commentId: string) => {
        if (!selectedPost) return;
        try {
            setError(null);
            const response = await commentService.likeComment(commentId);
            if (response.success) {
                // Refresh post details to get updated like count
                const updatedPost = await postService.getPostById(selectedPost.id);
                if (updatedPost.success && updatedPost.data) {
                    setSelectedPost(updatedPost.data);
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update like');
        }
    };

    const handleLoadMoreComments = () => {
        setVisibleComments(prev => prev + 3); // Load 3 more comments
    };

    // Handle delete comment
    const handleDeleteComment = async (commentId: string) => {
        if (!selectedPost) return;
        try {
            setError(null);
            await commentService.deleteComment(commentId);
            // Refresh post details to get updated comments
            const updatedPost = await postService.getPostById(selectedPost.id);
            if (updatedPost.success && updatedPost.data) {
                setSelectedPost(updatedPost.data);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to delete comment');
        }
    };

    // Recursive comment item
    function CommentItem({ comment, onReply, replyingTo, replyText, setReplyText, handleReplySubmit, handleLikeComment, handleDeleteComment, currentUserId }: any) {
        return (
            <div className="space-y-2">
                <div className="flex items-start gap-2">
                    <img
                        src={comment.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${comment.profilePicture}` : '/default-avatar.png'}
                        alt={comment.username}
                        className="w-7 h-7 rounded-full object-cover border mt-1"
                        onError={e => (e.currentTarget.src = '/default-avatar.png')}
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{comment.username}</span>
                            <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                        <div className="flex gap-2 items-center mt-1">
                            <button
                                className="text-xs text-blue-500 hover:underline"
                                onClick={() => onReply(comment.id.toString())}
                            >Reply</button>
                            {currentUserId === comment.userId && (
                                <button
                                    className="text-xs text-red-500 hover:underline"
                                    onClick={() => handleDeleteComment(comment.id)}
                                >Delete</button>
                            )}
                        </div>
                        {replyingTo === comment.id.toString() && (
                            <form onSubmit={(e) => handleReplySubmit(comment.id.toString(), e)} className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Reply to comment..."
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                >
                                    Reply
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onReply(null)}
                                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </form>
                        )}
                    </div>
                    <button
                        onClick={() => handleLikeComment(comment.id.toString())}
                        className="flex items-center gap-1 text-gray-400 hover:text-red-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm">{comment.likeCount}</span>
                    </button>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 space-y-2">
                        {comment.replies.map((reply: any) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                onReply={onReply}
                                replyingTo={replyingTo}
                                replyText={replyText}
                                setReplyText={setReplyText}
                                handleReplySubmit={handleReplySubmit}
                                handleLikeComment={handleLikeComment}
                                handleDeleteComment={handleDeleteComment}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Show back to top button after scrolling
    useEffect(() => {
        const onScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleBackToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Skeleton card component
    const SkeletonCard = () => (
        <div className="mb-6 break-inside-avoid rounded-xl bg-gray-200 animate-pulse h-[350px] w-full max-w-[400px] mx-auto shadow" />
    );

    // Add delete and update handlers
    const handleDeletePost = async () => {
        if (!selectedPost) return;
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/Post/posts/${selectedPost.id}`, {
                method: 'DELETE',
                headers: {
                    'accept': '*/*',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                showToast('Post deleted successfully.', 'success');
                setShowDeleteConfirm(false);
                setSelectedPost(null);
                setPosts(posts.filter(p => p.id !== selectedPost.id));
            } else {
                showToast(data.message || 'Failed to delete post', 'error');
            }
        } catch (err) {
            showToast('Failed to delete post', 'error');
        }
    };
    const handleUpdatePost = async () => {
        if (!selectedPost) return;
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/Post/update-description`, {
                method: 'PUT',
                headers: {
                    'accept': '*/*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({
                    description: updateDescription,
                    postId: selectedPost.id,
                }),
            });
            const data = await response.json();
            if (data.success) {
                showToast('Post description updated successfully.', 'success');
                setShowUpdateModal(false);
                // Refresh post
                const updatedPost = await postService.getPostById(selectedPost.id);
                if (updatedPost.success && updatedPost.data) {
                    setSelectedPost(updatedPost.data);
                    setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, description: updateDescription } : p));
                }
            } else {
                showToast(data.message || 'Failed to update post', 'error');
            }
        } catch (err) {
            showToast('Failed to update post', 'error');
        }
    };

    const fetchImages = async () => {
        try {
            setIsLoading(true);
            const response = await imageService.getImages(currentPage, pageSize);
            setImages(response.data ?? []);
            setTotalPages(Math.ceil((response.data?.length ?? 0) / pageSize));
        } catch (error) {
            console.error('Error fetching images:', error);
            setError('Failed to fetch images. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageClick = async (id: string) => {
        try {
            const response = await imageService.getImageById(id);
            setSelectedImage(response.data ?? null);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching image details:', error);
            setError('Failed to fetch image details. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (error && error !== 'You need to log in to continue.') {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900">{error}</h2>
            </div>
        );
    }

    return (
        <div className="py-8 bg-gray-50 font-sans min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Gallery</h1>
                {searchQuery && (
                    <div className="text-gray-600">
                        Search results for: <span className="font-semibold">{searchQuery}</span>
                        {posts.length === 0 && !loading && (
                            <span className="ml-2 text-gray-500">(No results found)</span>
                        )}
                    </div>
                )}
            </div>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                {(loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                    : posts.map((post) => (
                        <div
                            key={post.id}
                            className="mb-6 break-inside-avoid group relative rounded-xl overflow-hidden bg-white shadow hover:shadow-lg cursor-pointer transition-all border border-gray-100"
                            onClick={() => handlePostClick(post.id)}
                        >
                            <AuthenticatedImage
                                src={`${IMAGE_CONFIG.POST_PICTURE_URL}/${post.imageUrl || ''}`}
                                alt={post.description || ''}
                                className="w-full h-auto object-cover"
                                onError={() => {
                                    console.error('Error loading image');
                                }}
                            />
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <img
                                        src={post.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${post.profilePicture}` : '/default-avatar.png'}
                                        alt={post.username}
                                        className="w-7 h-7 rounded-full object-cover border"
                                        onError={e => (e.currentTarget.src = '/default-avatar.png')}
                                    />
                                    <span className="font-medium text-sm text-gray-700">{post.username}</span>
                                </div>
                                <p className="text-sm text-gray-800 mb-1 truncate">{post.description}</p>
                                <div className="flex gap-4 text-xs text-turkuaz-dark mt-1">
                                    <span>{post.likeCount} likes</span>
                                    <span>{post.commentCount} comments</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {/* Infinite scroll loader or skeletons */}
                <div ref={loadMoreRef} className="w-full flex justify-center py-8">
                    {loadingMore && (
                        <>
                            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                        </>
                    )}
                </div>
            </div>

            {/* Post Detail Modal (global) */}
            <PostModal
                isOpen={!!selectedPost}
                onClose={() => {
                    setSelectedPost(null);
                    setError(null);
                }}
                post={selectedPost}
                currentUserId={currentUserId}
                onLikePost={handleLikePost}
                onLikeComment={handleLikeComment}
                onCreateComment={handleCreateComment}
                onReplySubmit={handleReplySubmit}
                onDeleteComment={handleDeleteComment}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                loading={loading}
                error={error}
                showToast={showToast}
                newComment={newComment}
                setNewComment={setNewComment}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
            />

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    onClick={handleBackToTop}
                    className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-dark transition-colors"
                    title="Back to top"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            )}
        </div>
    );
} 