'use client';

import { useEffect, useState } from 'react';
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
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await postService.getAllPosts();
                if (response.success && response.data) {
                    setPosts(response.data);
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
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Gallery</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => handlePostClick(post.id)}
                    >
                        <Image
                            src={`${IMAGE_CONFIG.POST_PICTURE_URL}/${post.imageUrl || ''}`}
                            alt={post.description || ''}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                {/* Owner info row */}
                                <div className="flex items-center gap-2 mb-2">
                                    <img
                                        src={post.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${post.profilePicture}` : '/default-avatar.png'}
                                        alt={post.username}
                                        className="w-7 h-7 rounded-full object-cover border"
                                        onError={e => (e.currentTarget.src = '/default-avatar.png')}
                                    />
                                    <span className="font-medium text-sm">{post.username}</span>
                                </div>
                                <p className="text-sm truncate">{post.description}</p>
                                <div className="flex gap-4 text-sm text-gray-200 mt-1">
                                    <span>{post.likeCount} likes</span>
                                    <span>{post.commentCount} comments</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
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
                            <span className="font-semibold text-base">{selectedPost.username}</span>
                        </div>
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
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
                                    className="flex items-center gap-2 text-gray-600 hover:text-red-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{selectedPost.likeCount}</span>
                                </button>
                            </div>
                            {/* Comments Section */}
                            <div className="space-y-4">
                                <h4 className="font-semibold">Comments</h4>
                                <form onSubmit={handleCreateComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                    >
                                        Post
                                    </button>
                                </form>
                                <div className="space-y-4">
                                    {selectedPost.comments.map((comment) => (
                                        <div key={comment.id} className="space-y-2">
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
                                                    <button
                                                        className="text-xs text-indigo-500 hover:underline mt-1"
                                                        onClick={() => {
                                                            setReplyingTo(comment.id.toString());
                                                            setReplyText('');
                                                        }}
                                                    >Reply</button>
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
                                                                onClick={() => setReplyingTo(null)}
                                                                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </form>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => commentService.likeComment(comment.id.toString())}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {comment.replies.length > 0 && (
                                                <div className="ml-6 space-y-2">
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply.id} className="flex items-start gap-2">
                                                            <img
                                                                src={reply.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${reply.profilePicture}` : '/default-avatar.png'}
                                                                alt={reply.username}
                                                                className="w-6 h-6 rounded-full object-cover border mt-1"
                                                                onError={e => (e.currentTarget.src = '/default-avatar.png')}
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold">{reply.username}</span>
                                                                    <span className="text-sm text-gray-500">
                                                                        {new Date(reply.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700">{reply.comment}</p>
                                                                <button
                                                                    className="text-xs text-indigo-500 hover:underline mt-1"
                                                                    onClick={() => {
                                                                        setReplyingTo(reply.id.toString());
                                                                        setReplyText('');
                                                                    }}
                                                                >Reply</button>
                                                                {replyingTo === reply.id.toString() && (
                                                                    <form onSubmit={(e) => handleReplySubmit(reply.id.toString(), e)} className="flex gap-2 mt-2">
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
                                                                            onClick={() => setReplyingTo(null)}
                                                                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </form>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => commentService.likeComment(reply.id.toString())}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
} 