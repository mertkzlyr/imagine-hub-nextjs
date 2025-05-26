'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import Header from '@/components/Header';
import LeftNavigation from '@/components/LeftNavigation';

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            showToast('Invalid reset link', 'error');
            router.push('/');
        }
    }, [token, router, showToast]);

    if (!token) return null;

    return (
        <>
            <Header />
            <LeftNavigation />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Your main page content here */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Example content to show behind the blur */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Welcome to ImagineHub</h2>
                        <p className="text-gray-600">Share and create amazing AI art with our community.</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Create Art</h2>
                        <p className="text-gray-600">Use our AI tools to create unique and beautiful artwork.</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Join Community</h2>
                        <p className="text-gray-600">Connect with other artists and share your creations.</p>
                    </div>
                </div>
            </main>
            <ResetPasswordModal
                token={token}
                onClose={() => router.push('/')}
            />
        </>
    );
} 