"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Modal from './Modal';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { IMAGE_CONFIG } from '@/config';
import { useToast } from './ToastProvider';

export default function Header() {
    const { user, isAuthenticated, logout, login, loading } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchDisabled, setIsSearchDisabled] = useState(false);
    const [regData, setRegData] = useState({
        username: '',
        name: '',
        surname: '',
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const router = useRouter();
    const { showToast } = useToast();
    const [rememberMe, setRememberMe] = useState(true);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await login(email, password, rememberMe);
        setIsSubmitting(false);
        if (success) {
            setIsLoginOpen(false);
            setEmail('');
            setPassword('');
            router.push('/profile');
            showToast('Login successful!', 'success');
        } else {
            showToast('Invalid email or password', 'error');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.entries(regData).forEach(([key, value]) => {
                formData.append(key, value);
            });
            if (profilePicture) {
                formData.append('profilePicture', profilePicture);
            }
            const res = await authService.register(formData);
            if (res.success) {
                // Auto-login after registration
                const loginSuccess = await login(regData.email, regData.password);
                if (loginSuccess) {
                    setIsLoginOpen(false);
                    setRegData({ username: '', name: '', surname: '', email: '', password: '' });
                    setProfilePicture(null);
                    router.push('/profile');
                    showToast('Registration successful!', 'success');
                } else {
                    showToast('Registration succeeded but login failed.', 'error');
                }
            } else {
                showToast(res.message || 'Registration failed', 'error');
            }
        } catch (err) {
            showToast('Failed to register. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
        showToast('Logged out successfully.', 'success');
    };

    const avatarUrl = user?.profilePicture
        ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${user.profilePicture}`
        : '/default-avatar.png';

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setProfilePicture(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setProfilePicturePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setProfilePicturePreview(null);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/gallery?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            router.push('/gallery');
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-white shadow-sm font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex-1 flex justify-center">
                    <form onSubmit={handleSearch} className="w-full max-w-2xl flex justify-center">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-full bg-gray-100 px-6 py-3 text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary border border-gray-200 shadow-md"
                        />
                    </form>
                </div>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <Link href="/profile" className="flex items-center gap-2 group">
                                <img
                                    src={avatarUrl}
                                    alt={user?.username}
                                    className="w-8 h-8 rounded-full object-cover border group-hover:ring-2 group-hover:ring-primary"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                                    }}
                                />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-background hover:bg-turkuaz-light transition-colors border border-turkuaz/30"
                                title="Logout"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-turkuaz-dark">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => { setIsLoginOpen(true); setTab('login'); }}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm transition-colors"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
            <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title={tab === 'login' ? 'Login' : 'Register'}>
                <div className="flex mb-4 border-b">
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${tab === 'login' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                        onClick={() => setTab('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${tab === 'register' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}
                        onClick={() => setTab('register')}
                    >
                        Register
                    </button>
                </div>
                {tab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4 px-2 sm:px-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                                required
                            />
                        </div>
                        <div className="flex items-center mb-2">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                                Remember Me
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting || loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4 px-2 sm:px-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                value={regData.username}
                                onChange={e => setRegData({ ...regData, username: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={regData.name}
                                    onChange={e => setRegData({ ...regData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Surname</label>
                                <input
                                    type="text"
                                    value={regData.surname}
                                    onChange={e => setRegData({ ...regData, surname: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={regData.email}
                                onChange={e => setRegData({ ...regData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={regData.password}
                                onChange={e => setRegData({ ...regData, password: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                            <div className="flex items-center gap-4">
                                {profilePicturePreview ? (
                                    <img
                                        src={profilePicturePreview}
                                        alt="Profile Preview"
                                        className="w-12 h-12 rounded-full object-cover border"
                                    />
                                ) : (
                                    <img
                                        src={IMAGE_CONFIG.DEFAULT_PROFILE_PICTURE || '/default-avatar.png'}
                                        alt="Default Avatar"
                                        className="w-12 h-12 rounded-full object-cover border"
                                    />
                                )}
                                <label className="cursor-pointer px-3 py-2 bg-gray-100 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-200">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="hidden"
                                    />
                                    Choose Image
                                </label>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting || loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                )}
            </Modal>
        </header>
    );
} 