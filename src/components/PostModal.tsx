import React, { useState } from 'react';
import Modal from './Modal';
import Image from 'next/image';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { IMAGE_CONFIG } from '@/config';
import { useRouter } from 'next/navigation';

export default function PostModal({
    isOpen,
    onClose,
    post,
    currentUserId,
    onLikePost,
    onLikeComment,
    onCreateComment,
    onReplySubmit,
    onDeleteComment,
    onUpdatePost,
    onDeletePost,
    loading,
    error,
    showToast,
    newComment,
    setNewComment,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
}: {
    isOpen: boolean;
    onClose: () => void;
    post: any;
    currentUserId: number | null;
    onLikePost: () => void;
    onLikeComment: (commentId: string) => void;
    onCreateComment: (e: React.FormEvent) => void;
    onReplySubmit: (parentId: string, e: React.FormEvent) => void;
    onDeleteComment: (commentId: string) => void;
    onUpdatePost: (desc: string) => void;
    onDeletePost: () => void;
    loading: boolean;
    error: string | null;
    showToast: (msg: string, type: 'success' | 'error') => void;
    newComment: string;
    setNewComment: (v: string) => void;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyText: string;
    setReplyText: (v: string) => void;
}) {
    const router = useRouter();
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateDescription, setUpdateDescription] = useState(post?.description || '');
    const [visibleComments, setVisibleComments] = useState(3);

    if (!post) return null;

    function CommentItem({ comment }: { comment: any }) {
        console.log('DEBUG: currentUserId:', currentUserId, 'comment.userId:', comment.userId);
        const handleProfileClick = () => {
            router.push(`/profile/${comment.username}`);
        };

        return (
            <div className="space-y-2">
                <div className="flex items-start gap-2">
                    <button
                        onClick={handleProfileClick}
                        className="group focus:outline-none"
                        aria-label={`Go to ${comment.username}'s profile`}
                    >
                        <img
                            src={comment.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${comment.profilePicture}` : '/default-avatar.png'}
                            alt={comment.username}
                            className="w-7 h-7 rounded-full object-cover border mt-1 group-hover:ring-2 group-hover:ring-blue-400 transition-all"
                            onError={e => (e.currentTarget.src = '/default-avatar.png')}
                        />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleProfileClick}
                                className="font-semibold hover:text-blue-600 transition-colors focus:outline-none"
                            >
                                {comment.username}
                            </button>
                            <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                        <div className="flex gap-2 items-center mt-1">
                            <button
                                className="text-xs text-blue-500 hover:underline"
                                onClick={() => setReplyingTo(comment.id.toString())}
                            >Reply</button>
                            {currentUserId === comment.userId && (
                                <button
                                    className="text-xs text-red-500 hover:underline"
                                    onClick={() => onDeleteComment(comment.id.toString())}
                                >Delete</button>
                            )}
                        </div>
                        {replyingTo === comment.id.toString() && (
                            <form onSubmit={(e) => onReplySubmit(comment.id.toString(), e)} className="flex gap-2 mt-2">
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
                                    onClick={() => setReplyingTo(null)}
                                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </form>
                        )}
                    </div>
                    <button
                        onClick={() => onLikeComment(comment.id.toString())}
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
                            <CommentItem key={reply.id} comment={reply} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="">
                {loading ? (
                    <div className="flex justify-center items-center min-h-[200px] text-gray-500">Loading...</div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <button
                                className="flex items-center gap-2 group hover:underline focus:outline-none"
                                onClick={() => window.location.href = `/profile/${post.username}`}
                                aria-label={`Go to ${post.username}'s profile`}
                            >
                                <img
                                    src={post.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${post.profilePicture}` : '/default-avatar.png'}
                                    alt={post.username}
                                    className="w-9 h-9 rounded-full object-cover border group-hover:ring-2 group-hover:ring-blue-400 transition-all"
                                    onError={e => (e.currentTarget.src = '/default-avatar.png')}
                                />
                                <span className="font-semibold text-base text-primary group-hover:text-blue-600 transition-colors">{post.username}</span>
                            </button>
                            {post.userId === currentUserId && (
                                <div className="ml-auto relative">
                                    <button
                                        onClick={() => setShowPostMenu(v => !v)}
                                        className="p-2 rounded-full hover:bg-gray-100"
                                        aria-label="Post options"
                                    >
                                        <HiOutlineDotsVertical className="w-6 h-6 text-gray-500" />
                                    </button>
                                    {showPostMenu && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                                            <button
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                                onClick={() => { setShowUpdateModal(true); setUpdateDescription(post.description || ''); setShowPostMenu(false); }}
                                            >Update Post</button>
                                            <button
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                                                onClick={() => { setShowDeleteConfirm(true); setShowPostMenu(false); }}
                                            >Delete Post</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="w-full flex justify-center items-center bg-gray-100 rounded-xl overflow-hidden" style={{ maxHeight: '60vh' }}>
                            <img
                                src={`${IMAGE_CONFIG.POST_PICTURE_URL}/${post.imageUrl || ''}`}
                                alt={post.description || ''}
                                className="max-h-[60vh] w-auto h-auto object-contain"
                                style={{ display: 'block', margin: '0 auto' }}
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{post.description}</p>
                                </div>
                                <button
                                    onClick={onLikePost}
                                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 bg-background rounded-full px-3 py-1 shadow-sm border border-blue-100 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={post.isLikedByCurrentUser ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{post.likeCount}</span>
                                </button>
                            </div>
                            {/* Comments Section */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-primary">Comments</h4>
                                <form onSubmit={onCreateComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-1 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full shadow-sm transition-colors flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                        Post
                                    </button>
                                </form>
                                <div className="space-y-4">
                                    {post.comments.slice(0, visibleComments).map((comment: any) => (
                                        <CommentItem key={comment.id} comment={comment} />
                                    ))}
                                    {post.comments.length > visibleComments && (
                                        <button
                                            onClick={() => setVisibleComments(prev => prev + 3)}
                                            className="text-primary hover:text-turkuaz font-medium text-sm"
                                        >See more comments ({post.comments.length - visibleComments} remaining)</button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Delete Confirmation Modal */}
                        <Modal
                            isOpen={showDeleteConfirm}
                            onClose={() => setShowDeleteConfirm(false)}
                            title="Delete Post"
                        >
                            <div className="p-4">
                                <p className="mb-4 text-gray-700">Are you sure you want to delete this post? This action cannot be undone.</p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    >Cancel</button>
                                    <button
                                        onClick={onDeletePost}
                                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                                    >Delete</button>
                                </div>
                            </div>
                        </Modal>
                        {/* Update Post Modal */}
                        <Modal
                            isOpen={showUpdateModal}
                            onClose={() => setShowUpdateModal(false)}
                            title="Update Post Description"
                        >
                            <form
                                onSubmit={e => { e.preventDefault(); onUpdatePost(updateDescription); }}
                                className="p-4 space-y-4"
                            >
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <input
                                    type="text"
                                    value={updateDescription}
                                    onChange={e => setUpdateDescription(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                                    required
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowUpdateModal(false)}
                                        className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    >Cancel</button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >Update</button>
                                </div>
                            </form>
                        </Modal>
                    </div>
                )}
            </Modal>
        </>
    );
} 