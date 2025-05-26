'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { userService, User, UpdateUserDto, UpdatePasswordDto } from '@/services/user';
import { IMAGE_CONFIG, API_CONFIG } from '@/config';
import Modal from '@/components/Modal';
import { postService } from '@/services/post';
import { commentService } from '@/services/comment';
import { useRouter } from 'next/navigation';
import { followService } from '@/services/follow';
import { useToast } from '@/components/ToastProvider';
import PostModal from '@/components/PostModal';
import { imageService } from '@/services/image';
import { tokenService } from '@/services/token';

export default function Profile() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [updateData, setUpdateData] = useState<UpdateUserDto>({});
    const [passwordData, setPasswordData] = useState<UpdatePasswordDto>({
        currentPassword: '',
        newPassword: '',
    });
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [visibleComments, setVisibleComments] = useState(3);
    const router = useRouter();
    const currentUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || sessionStorage.getItem('userId')) : null;

    const [listModalOpen, setListModalOpen] = useState(false);
    const [listType, setListType] = useState<'followers' | 'following'>('followers');
    const [listUsers, setListUsers] = useState<any[]>([]);
    const [listPage, setListPage] = useState(1);
    const [listTotalPages, setListTotalPages] = useState(1);
    const [listLoading, setListLoading] = useState(false);

    const { showToast } = useToast();

    const [aiCreations, setAiCreations] = useState<any[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiPage, setAiPage] = useState(1);
    const [aiTotalPages, setAiTotalPages] = useState(1);

    const [selectedTab, setSelectedTab] = useState<'posts' | 'creations'>('posts');

    // Only show for own profile
    const isOwnProfile = user && currentUserId && user.id === currentUserId;

    const [selectedAiCreation, setSelectedAiCreation] = useState<any | null>(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiModalLoading, setAiModalLoading] = useState(false);
    const [aiModalError, setAiModalError] = useState<string | null>(null);

    const fetchAiCreations = useCallback(async (page = 1) => {
        setAiLoading(true);
        setAiError(null);
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            const res = await fetch(`${API_CONFIG.BASE_URL}/Image?page=${page}&pageSize=12`, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '', 'accept': '*/*' },
            });
            if (!res.ok) throw new Error('Failed to fetch AI creations');
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setAiCreations(data.data);
                setAiPage(data.pagination?.currentPage || page);
                setAiTotalPages(data.pagination?.totalPages || 1);
            } else {
                setAiError('Failed to fetch AI creations');
            }
        } catch (err) {
            setAiError('Failed to fetch AI creations');
        } finally {
            setAiLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOwnProfile) fetchAiCreations(1);
    }, [isOwnProfile, fetchAiCreations]);

    // Add handlePageChange function
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= aiTotalPages) {
            fetchAiCreations(newPage);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await userService.getProfile();
            if (response.success && response.data) {
                setUser(response.data);
            }
        } catch (error) {
            setError('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await userService.updateProfile(updateData);
            if (response.success && response.data) {
                setUser(response.data);
                setSuccess('Profile updated successfully');
                setIsModalOpen(false);
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(response.message || 'Failed to update profile');
            }
        } catch (error) {
            setError('Failed to update profile');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await userService.updatePassword(passwordData);
            if (response.success) {
                setSuccess('Password updated successfully');
                setPasswordData({ currentPassword: '', newPassword: '' });
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (error) {
            setError('Failed to update password');
        }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await userService.deleteAccount(deletePassword);
            if (response.success) {
                window.location.href = '/login';
            }
        } catch (error) {
            setError('Failed to delete account');
        }
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (7MB = 7 * 1024 * 1024 bytes)
        if (file.size > 7 * 1024 * 1024) {
            setError('Profile picture must be less than 7MB');
            return;
        }

        // Check file extension
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() as '.jpg' | '.jpeg' | '.png' | '.webp' | '.gif';
        if (!IMAGE_CONFIG.SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) {
            setError(`File type must be one of: ${IMAGE_CONFIG.SUPPORTED_IMAGE_EXTENSIONS.join(', ')}`);
            return;
        }

        // Check image dimensions
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);

        await new Promise<boolean>((resolve) => {
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                if (img.width > 512 || img.height > 512) {
                    setError('Profile picture dimensions must not exceed 512x512 pixels');
                    resolve(false);
                } else {
                    resolve(true);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                setError('Failed to load image');
                resolve(false);
            };
        }).then(async (isValid) => {
            if (!isValid) return;

            try {
                const response = await userService.updateProfilePicture(file);
                if (response.success) {
                    fetchUserData();
                    setSuccess('Profile picture updated successfully');
                    setTimeout(() => setSuccess(null), 3000);
                }
            } catch (error) {
                setError('Failed to update profile picture');
            }
        });
    };

    const handlePostClick = async (postId: string) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const response = await postService.getPostById(postId);
            if (response.success && response.data) {
                setSelectedPost(response.data);
                setVisibleComments(3);
            } else {
                setModalError(response.message || 'Failed to load post details');
            }
        } catch (err) {
            setModalError('Failed to load post details');
        } finally {
            setModalLoading(false);
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
        const wasLiked = selectedPost.isLikedByCurrentUser;
        setSelectedPost({ ...selectedPost, isLikedByCurrentUser: !wasLiked, likeCount: selectedPost.likeCount + (wasLiked ? -1 : 1) });
        setModalError(null);
        try {
            if (wasLiked) {
                const response = await postService.unlikePost(selectedPost.id);
                if (!response.success) {
                    if (response.message?.toLowerCase().includes('not liked')) {
                        await postService.likePost(selectedPost.id);
                    } else {
                        setModalError(response.message || 'Failed to unlike post');
                    }
                }
            } else {
                const response = await postService.likePost(selectedPost.id);
                if (!response.success) {
                    if (response.message?.toLowerCase().includes('already liked')) {
                        await postService.unlikePost(selectedPost.id);
                    } else {
                        setModalError(response.message || 'Failed to like post');
                    }
                }
            }
            const updatedPost = await postService.getPostById(selectedPost.id);
            if (updatedPost.success && updatedPost.data) {
                setSelectedPost(updatedPost.data);
            }
        } catch (error) {
            setModalError('Failed to update like');
        }
    };

    const handleLikeComment = async (commentId: string) => {
        if (!selectedPost) return;
        try {
            setModalError(null);
            const response = await commentService.likeComment(commentId);
            if (response.success) {
                const updatedPost = await postService.getPostById(selectedPost.id);
                if (updatedPost.success && updatedPost.data) {
                    setSelectedPost(updatedPost.data);
                }
            }
        } catch (error) {
            setModalError('Failed to update like');
        }
    };

    const handleLoadMoreComments = () => {
        setVisibleComments(prev => prev + 3);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!selectedPost) return;
        try {
            setModalError(null);
            await commentService.deleteComment(commentId);
            const updatedPost = await postService.getPostById(selectedPost.id);
            if (updatedPost.success && updatedPost.data) {
                setSelectedPost(updatedPost.data);
            }
        } catch (error) {
            setModalError('Failed to delete comment');
        }
    };

    const handleUpdatePost = async (desc: string) => {
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
                    description: desc,
                    postId: selectedPost.id,
                }),
            });
            const data = await response.json();
            if (data.success) {
                showToast('Post description updated successfully.', 'success');
                // Refresh post
                const updatedPost = await postService.getPostById(selectedPost.id);
                if (updatedPost.success && updatedPost.data) {
                    setSelectedPost(updatedPost.data);
                }
            } else {
                showToast(data.message || 'Failed to update post', 'error');
            }
        } catch (err) {
            showToast('Failed to update post', 'error');
        }
    };

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
                setSelectedPost(null);
                // Refresh user data to update post count
                fetchUserData();
            } else {
                showToast(data.message || 'Failed to delete post', 'error');
            }
        } catch (err) {
            showToast('Failed to delete post', 'error');
        }
    };

    const openListModal = async (type: 'followers' | 'following') => {
        setListType(type);
        setListModalOpen(true);
        setListPage(1);
        await fetchList(type, 1);
    };

    const fetchList = async (type: 'followers' | 'following', page: number) => {
        setListLoading(true);
        try {
            const res = type === 'followers'
                ? await followService.getFollowers(page, 10)
                : await followService.getFollowing(page, 10);
            if (res.success) {
                setListUsers(res.data);
                setListTotalPages(res.pagination?.totalPages || 1);
            } else {
                setListUsers([]);
                setListTotalPages(1);
            }
        } finally {
            setListLoading(false);
        }
    };

    const handleListPageChange = async (newPage: number) => {
        setListPage(newPage);
        await fetchList(listType, newPage);
    };

    function CommentItem({ comment, onReply, replyingTo, replyText, setReplyText, handleReplySubmit, handleLikeComment, handleDeleteComment, currentUserId }: { comment: any, onReply: any, replyingTo: any, replyText: any, setReplyText: any, handleReplySubmit: any, handleLikeComment: any, handleDeleteComment: any, currentUserId: any }) {
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

    // Fetch AI creation details
    const handleAiCreationClick = async (id: string) => {
        setAiModalLoading(true);
        setAiModalError(null);
        setAiModalOpen(true);
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            const res = await fetch(`${API_CONFIG.BASE_URL}/Image/${id}`, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '', 'accept': '*/*' },
            });
            if (!res.ok) throw new Error('Failed to fetch creation');
            const data = await res.json();
            setSelectedAiCreation(data);
        } catch (err) {
            setAiModalError('Failed to load creation');
        } finally {
            setAiModalLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900">Please log in to view your profile</h2>
            </div>
        );
    }

    if (error && error !== 'You need to log in to continue.') {
        return (
            <div className="bg-red-50 text-red-500 p-4 rounded-md">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-md">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-500 p-4 rounded-md">
                    {success}
                </div>
            )}

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-lg shadow">
                <div className="relative">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                        <Image
                            src={`${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${user.profilePicture || IMAGE_CONFIG.DEFAULT_PROFILE_PICTURE}`}
                            alt={user.username}
                            fill
                            className="object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${IMAGE_CONFIG.DEFAULT_PROFILE_PICTURE}`;
                            }}
                        />
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </label>
                </div>

                <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                    <p className="text-gray-600">{user.name} {user.surname}</p>
                    {user.city && user.country && (
                        <p className="text-gray-600">{user.city}, {user.country}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                        <button className="hover:underline" onClick={() => openListModal('followers')}>
                            {user.postCount} posts
                        </button>
                        <button className="hover:underline" onClick={() => openListModal('followers')}>
                            {user.followers} followers
                        </button>
                        <button className="hover:underline" onClick={() => openListModal('following')}>
                            {user.following} following
                        </button>
                    </div>
                </div>

                <div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                }}
                title="Edit Profile"
            >
                <div className="space-y-6">
                    {/* Profile Information Form */}
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={updateData.username ?? user.username}
                                    onChange={(e) => setUpdateData({ ...updateData, username: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={updateData.name ?? user.name}
                                    onChange={(e) => setUpdateData({ ...updateData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                                <input
                                    type="text"
                                    value={updateData.surname ?? user.surname}
                                    onChange={(e) => setUpdateData({ ...updateData, surname: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter surname"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    value={updateData.city ?? user.city ?? ''}
                                    onChange={(e) => setUpdateData({ ...updateData, city: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter city"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    value={updateData.country ?? user.country ?? ''}
                                    onChange={(e) => setUpdateData({ ...updateData, country: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter country"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>

                    {/* Change Password Form */}
                    <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 border-t">
                        <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                            >
                                Update Password
                            </button>
                        </div>
                    </form>

                    {/* Delete Account Section */}
                    <div className="pt-4 border-t">
                        <h2 className="text-lg font-medium text-red-600 mb-4">Delete Account</h2>
                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <form onSubmit={handleDeleteAccount} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Enter your password to confirm deletion
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                                    >
                                        Confirm Deletion
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeletePassword('');
                                        }}
                                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Tab Selector */}
            <div className="relative flex gap-2 mb-6 border-b-2 border-blue-100">
                <button
                    className={`relative px-4 py-2 font-semibold transition-colors focus:outline-none ${selectedTab === 'posts' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    onClick={() => setSelectedTab('posts')}
                >
                    Posts
                    {selectedTab === 'posts' && (
                        <span className="absolute left-0 right-0 -bottom-[2px] h-1 bg-blue-600 rounded-t-md" style={{ width: '100%' }} />
                    )}
                </button>
                {isOwnProfile && (
                    <button
                        className={`relative px-4 py-2 font-semibold transition-colors focus:outline-none ${selectedTab === 'creations' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                        onClick={() => setSelectedTab('creations')}
                    >
                        My Creations
                        {selectedTab === 'creations' && (
                            <span className="absolute left-0 right-0 -bottom-[2px] h-1 bg-blue-600 rounded-t-md" style={{ width: '100%' }} />
                        )}
                    </button>
                )}
            </div>

            {/* User's Posts */}
            {selectedTab === 'posts' && (
                <div>
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                        {user.posts.map((post) => (
                            <div key={post.id} className="mb-6 break-inside-avoid group relative rounded-xl overflow-hidden bg-white shadow hover:shadow-lg cursor-pointer transition-all border border-gray-100"
                                onClick={() => handlePostClick(post.id.toString())}
                            >
                                <Image
                                    src={`${IMAGE_CONFIG.POST_PICTURE_URL}/${post.imageUrl}`}
                                    alt={post.description}
                                    width={400}
                                    height={400}
                                    className="w-full h-auto object-cover"
                                />
                                <div className="p-4">
                                    <p className="text-sm text-gray-800 mb-1 truncate">{post.description}</p>
                                    <div className="flex gap-4 text-xs text-turkuaz-dark mt-1">
                                        <span>{post.likeCount} likes</span>
                                        <span>{post.commentCount} comments</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* My Creations (AI) */}
            {isOwnProfile && selectedTab === 'creations' && (
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {aiCreations.map((item) => (
                            <div key={item.id} className="mb-6 break-inside-avoid group relative rounded-xl overflow-hidden bg-white shadow hover:shadow-lg cursor-pointer transition-all border border-gray-100"
                                onClick={() => handleAiCreationClick(item.id)}
                            >
                                <Image
                                    src={`${IMAGE_CONFIG.AI_PICTURE_URL}/${item.imageUrl}`}
                                    alt={item.prompt}
                                    width={400}
                                    height={400}
                                    className="w-full h-auto object-cover"
                                />
                                <div className="p-4">
                                    <p className="text-sm text-gray-800 mb-1 truncate">{item.prompt}</p>
                                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {aiLoading && Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="mb-6 break-inside-avoid rounded-xl bg-gray-200 animate-pulse h-[350px] w-full max-w-[400px] mx-auto shadow" />
                        ))}
                    </div>
                    {aiError && <div className="text-red-500 mt-4">{aiError}</div>}
                    {aiCreations.length === 0 && !aiLoading && !aiError && (
                        <div className="text-gray-500">No AI creations yet.</div>
                    )}
                    {/* Pagination Controls */}
                    {aiTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => handlePageChange(aiPage - 1)}
                                disabled={aiPage === 1 || aiLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {aiPage} of {aiTotalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(aiPage + 1)}
                                disabled={aiPage === aiTotalPages || aiLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Post Detail Modal */}
            <PostModal
                isOpen={!!selectedPost}
                onClose={() => {
                    setSelectedPost(null);
                    setModalError(null);
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
                loading={modalLoading}
                error={modalError}
                showToast={showToast}
                newComment={newComment}
                setNewComment={setNewComment}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
            />

            {/* List Modal */}
            <Modal
                isOpen={listModalOpen}
                onClose={() => setListModalOpen(false)}
                title={listType === 'followers' ? 'Followers' : 'Following'}
            >
                {listLoading ? (
                    <div className="py-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <div>
                        {listUsers.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">No users found.</div>
                        ) : (
                            <ul className="divide-y">
                                {listUsers.map((u) => (
                                    <li key={u.id} className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded"
                                        onClick={() => { setListModalOpen(false); router.push(`/profile/${u.username}`); }}
                                    >
                                        <img
                                            src={u.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${u.profilePicture}` : '/default-avatar.png'}
                                            alt={u.username}
                                            className="w-9 h-9 rounded-full object-cover border"
                                            onError={e => (e.currentTarget.src = '/default-avatar.png')}
                                        />
                                        <div>
                                            <div className="font-semibold">{u.username}</div>
                                            <div className="text-xs text-gray-500">{u.name} {u.surname}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Pagination */}
                        {listTotalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button
                                    disabled={listPage === 1}
                                    onClick={() => handleListPageChange(listPage - 1)}
                                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                >Prev</button>
                                <span className="px-2">Page {listPage} of {listTotalPages}</span>
                                <button
                                    disabled={listPage === listTotalPages}
                                    onClick={() => handleListPageChange(listPage + 1)}
                                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                >Next</button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* AI Creation Modal */}
            <Modal
                isOpen={aiModalOpen}
                onClose={() => { setAiModalOpen(false); setSelectedAiCreation(null); setAiModalError(null); }}
                title="AI Creation"
            >
                {aiModalLoading ? (
                    <div className="flex justify-center items-center min-h-[300px] text-gray-500">Loading...</div>
                ) : aiModalError ? (
                    <div className="text-red-500">{aiModalError}</div>
                ) : selectedAiCreation ? (
                    <div className="space-y-6">
                        <div className="w-full flex justify-center items-center bg-gray-100 rounded-xl overflow-hidden" style={{ maxHeight: '60vh' }}>
                            <img
                                src={`${IMAGE_CONFIG.AI_PICTURE_URL}/${selectedAiCreation.imageUrl}`}
                                alt={selectedAiCreation.prompt}
                                className="max-h-[60vh] w-auto h-auto object-contain"
                                style={{ display: 'block', margin: '0 auto' }}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="font-semibold text-lg text-gray-900">{selectedAiCreation.prompt}</div>
                            <div className="text-gray-500 text-sm">{new Date(selectedAiCreation.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-4 justify-end mt-4">
                            <button
                                onClick={async () => {
                                    const url = `${IMAGE_CONFIG.AI_PICTURE_URL}/${selectedAiCreation.imageUrl}`;
                                    const response = await fetch(url);
                                    const blob = await response.blob();
                                    const link = document.createElement('a');
                                    link.href = window.URL.createObjectURL(blob);
                                    link.download = selectedAiCreation.imageUrl || 'ai-image.webp';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Download
                            </button>
                            {user.posts.some(post => post.description === selectedAiCreation.prompt) ? (
                                <button
                                    disabled
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                                    title="Already posted to gallery"
                                >
                                    Already in Gallery
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
                                        try {
                                            // First fetch the image as a blob
                                            const imageUrl = `${IMAGE_CONFIG.AI_PICTURE_URL}/${selectedAiCreation.imageUrl}`;
                                            const imageResponse = await fetch(imageUrl, {
                                                headers: {
                                                    'Authorization': token ? `Bearer ${token}` : '',
                                                }
                                            });
                                            if (!imageResponse.ok) throw new Error('Failed to fetch image');
                                            const imageBlob = await imageResponse.blob();

                                            // Create form data with the blob
                                            const formData = new FormData();
                                            formData.append('Description', selectedAiCreation.prompt);
                                            formData.append('Picture', imageBlob, selectedAiCreation.imageUrl);

                                            const response = await fetch(`${API_CONFIG.BASE_URL}/Post/posts`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': token ? `Bearer ${token}` : '',
                                                },
                                                body: formData,
                                            });
                                            if (response.ok) {
                                                showToast('Image saved to gallery!', 'success');
                                                // Refresh user data to update the posts list
                                                const userResponse = await userService.getProfile();
                                                if (userResponse.success && userResponse.data) {
                                                    setUser(userResponse.data);
                                                }
                                            } else {
                                                const errorData = await response.json();
                                                showToast(errorData.message || 'Failed to save image to gallery.', 'error');
                                            }
                                        } catch (err) {
                                            console.error('Error sharing image:', err);
                                            showToast('Failed to save image to gallery.', 'error');
                                        }
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Share to Gallery
                                </button>
                            )}
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
} 