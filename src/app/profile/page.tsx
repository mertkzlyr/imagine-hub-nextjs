'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { userService, User, UpdateUserDto, UpdatePasswordDto } from '@/services/user';
import { IMAGE_CONFIG } from '@/config';
import Modal from '@/components/Modal';

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
                setTimeout(() => setSuccess(null), 3000);
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
                    <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer">
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
                        <span>{user.postCount} posts</span>
                        <span>{user.followers} followers</span>
                        <span>{user.following} following</span>
                    </div>
                </div>

                <div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
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
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={updateData.name || user.name}
                                    onChange={(e) => setUpdateData({ ...updateData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Surname</label>
                                <input
                                    type="text"
                                    value={updateData.surname || user.surname}
                                    onChange={(e) => setUpdateData({ ...updateData, surname: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    value={updateData.city || user.city || ''}
                                    onChange={(e) => setUpdateData({ ...updateData, city: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country</label>
                                <input
                                    type="text"
                                    value={updateData.country || user.country || ''}
                                    onChange={(e) => setUpdateData({ ...updateData, country: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
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
                                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
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
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <form onSubmit={handleDeleteAccount} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Enter your password to confirm deletion
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                    >
                                        Confirm Deletion
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeletePassword('');
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </Modal>

            {/* User's Posts */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Posts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {user.posts.map((post) => (
                        <div key={post.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                                src={`${IMAGE_CONFIG.POST_PICTURE_URL}/${post.imageUrl}`}
                                alt={post.description}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
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
            </div>
        </div>
    );
} 