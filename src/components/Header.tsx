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
    const [regData, setRegData] = useState({
        username: '',
        name: '',
        surname: '',
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const router = useRouter();
    const { showToast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await login(email, password);
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

    return (
        <header className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <Link href="/" className="text-xl font-bold text-indigo-700">ImagineHub</Link>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-2">
                                <img
                                    src={avatarUrl}
                                    alt={user?.username}
                                    className="w-8 h-8 rounded-full object-cover border"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                                    }}
                                />
                                <span className="text-gray-700">{user?.username}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => { setIsLoginOpen(true); setTab('login'); }}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
            <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title={tab === 'login' ? 'Login' : 'Register'}>
                <div className="flex mb-4 border-b">
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${tab === 'login' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500'}`}
                        onClick={() => setTab('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${tab === 'register' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500'}`}
                        onClick={() => setTab('register')}
                    >
                        Register
                    </button>
                </div>
                {tab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
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
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                value={regData.username}
                                onChange={e => setRegData({ ...regData, username: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Surname</label>
                                <input
                                    type="text"
                                    value={regData.surname}
                                    onChange={e => setRegData({ ...regData, surname: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={regData.password}
                                onChange={e => setRegData({ ...regData, password: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setProfilePicture(e.target.files?.[0] || null)}
                                className="mt-1 block w-full text-sm text-gray-500"
                            />
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