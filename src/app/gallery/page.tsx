'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { postService } from '@/services/post';
import { commentService } from '@/services/comment';
import { Post, PostDetail, Comment } from '@/services/types';
import Image from 'next/image';
import { IMAGE_CONFIG } from '@/config';
import Modal from '@/components/Modal';

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
    const observer = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Example: get current user ID (replace with your actual logic)
    const currentUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : null;

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const response = await postService.getAllPosts(1, 10);
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
    }, []);

    const fetchMorePosts = useCallback(async () => {
        if (isFetching || loadingMore || currentPage >= totalPages) return;
        setIsFetching(true);
        setLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const response = await postService.getAllPosts(nextPage, 10);
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
    }, [isFetching, loadingMore, currentPage, totalPages]);

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
            setError(null); // Clear any previous errors
            const response = await commentService.createComment({
                postId: selectedPost.id,
                comment: newComment.trim()
            });

            if (response.success) {
                // Refresh post details to get the new comment
                const updatedPost = await postService.getPostById(selectedPost.id);
                if (updatedPost.success && updatedPost.data) {
                    setSelectedPost(updatedPost.data);
                }
                setNewComment('');
            } else {
                setError('Failed to create comment');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            setError(error instanceof Error ? error.message : 'Failed to create comment');
        }
    };

    const handleReplySubmit = async (parentId: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPost || !replyText.trim()) return;
        try {
            setError(null);
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
            } else {
                setError('Failed to reply to comment');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to reply to comment');
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
                                className="text-xs text-indigo-500 hover:underline"
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
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
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
        <div className="container mx-auto px-4 py-8 bg-gray-50 font-sans min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-primary">Gallery</h1>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                {(loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                    : posts.map((post) => (
                        <div
                            key={post.id}
                            className="mb-6 break-inside-avoid group relative rounded-xl overflow-hidden bg-white shadow hover:shadow-lg cursor-pointer transition-all border border-gray-100"
                            onClick={() => handlePostClick(post.id)}
                        >
                            <Image
                                src={`${IMAGE_CONFIG.POST_PICTURE_URL}/${post.imageUrl || ''}`}
                                alt={post.description || ''}
                                width={400}
                                height={400}
                                className="w-full h-auto object-cover"
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

            {/* Post Detail Modal */}
            <Modal
                isOpen={!!selectedPost}
                onClose={() => {
                    setSelectedPost(null);
                    setError(null); // Clear errors when closing modal
                }}
                title=""
            >
                {selectedPost && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <img
                                src={selectedPost.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${selectedPost.profilePicture}` : '/default-avatar.png'}
                                alt={selectedPost.username}
                                className="w-9 h-9 rounded-full object-cover border"
                                onError={e => (e.currentTarget.src = '/default-avatar.png')}
                            />
                            <span className="font-semibold text-base text-primary">{selectedPost.username}</span>
                        </div>
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                            <Image
                                src={`${IMAGE_CONFIG.POST_PICTURE_URL}/${selectedPost.imageUrl || ''}`}
                                alt={selectedPost.description || ''}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{selectedPost.description}</p>
                                </div>
                                <button
                                    onClick={handleLikePost}
                                    className="flex items-center gap-2 text-turkuaz-dark hover:text-primary bg-background rounded-full px-3 py-1 shadow-sm border border-turkuaz/20 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{selectedPost.likeCount}</span>
                                </button>
                            </div>
                            {/* Comments Section */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-primary">Comments</h4>
                                <form onSubmit={handleCreateComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-1 rounded-md border border-gray-200 shadow-sm focus:border-primary focus:ring-primary"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-full shadow-sm transition-colors"
                                    >
                                        Post
                                    </button>
                                </form>
                                <div className="space-y-4">
                                    {selectedPost.comments.slice(0, visibleComments).map((comment) => (
                                        <CommentItem
                                            key={comment.id}
                                            comment={comment}
                                            onReply={setReplyingTo}
                                            replyingTo={replyingTo}
                                            replyText={replyText}
                                            setReplyText={setReplyText}
                                            handleReplySubmit={handleReplySubmit}
                                            handleLikeComment={handleLikeComment}
                                            handleDeleteComment={handleDeleteComment}
                                            currentUserId={currentUserId}
                                        />
                                    ))}
                                    {selectedPost.comments.length > visibleComments && (
                                        <button
                                            onClick={handleLoadMoreComments}
                                            className="text-primary hover:text-turkuaz font-medium text-sm"
                                        >
                                            See more comments ({selectedPost.comments.length - visibleComments} remaining)
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

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