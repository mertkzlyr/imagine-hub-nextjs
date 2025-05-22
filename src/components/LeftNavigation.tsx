'use client';

import { useRouter } from 'next/navigation';
import { FaHome, FaCompass, FaCommentDots, FaPlus, FaTimes, FaImage, FaUserCircle } from 'react-icons/fa';
import { useState, ChangeEvent, FormEvent, useRef } from 'react';
import { postService } from '@/services/post';
import { useToast } from './ToastProvider';

const LeftNavigation = () => {
    const router = useRouter();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleChooseImage = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedImage || !description.trim()) return;
        setSubmitting(true);
        try {
            const result = await postService.createPost({
                description,
                picture: selectedImage,
            });
            if (result.success) {
                showToast('Post created successfully!', 'success');
                setShowCreateModal(false);
                setSelectedImage(null);
                setImagePreview(null);
                setDescription('');
                // Fast reload the gallery
                router.refresh && router.refresh();
            } else {
                showToast(result.message || 'Failed to create post', 'error');
            }
        } catch (err) {
            showToast('Failed to create post', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-between h-[420px] w-20 p-4 bg-white shadow-2xl rounded-r-2xl z-40">
                <div className="flex flex-col items-center gap-8 w-full h-full justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center justify-center p-0 rounded-full transition-all group"
                        aria-label="Go to home"
                    >
                        <FaHome className="w-7 h-7 text-gray-800 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                    </button>
                    <button
                        onClick={() => router.push('/gallery')}
                        className="flex items-center justify-center p-0 rounded-full transition-all group"
                        aria-label="Discover gallery"
                    >
                        <FaCompass className="w-7 h-7 text-gray-800 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center p-0 bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-lg w-12 h-12 group"
                        aria-label="Create new post"
                    >
                        <FaPlus className="w-6 h-6 text-white group-hover:scale-110 transition-all" />
                    </button>
                    <button
                        onClick={() => router.push('/create')}
                        className="flex items-center justify-center p-0 rounded-full transition-all group"
                        aria-label="Create with AI"
                    >
                        <FaCommentDots className="w-7 h-7 text-gray-800 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                    </button>
                    <button
                        onClick={() => router.push('/profile')}
                        className="flex items-center justify-center p-0 rounded-full transition-all group"
                        aria-label="Profile"
                    >
                        <FaUserCircle className="w-7 h-7 text-gray-800 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                    </button>
                </div>
            </div>
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                            onClick={() => setShowCreateModal(false)}
                            aria-label="Close"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold mb-4">Create Post</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                ref={fileInputRef}
                                required
                            />
                            <button
                                type="button"
                                onClick={handleChooseImage}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium shadow border border-gray-200 transition-colors"
                            >
                                <FaImage className="w-5 h-5" />
                                {selectedImage ? 'Change Image' : 'Choose Image'}
                            </button>
                            {imagePreview && (
                                <div className="w-full flex justify-center items-center bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '60vh' }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-h-[60vh] w-auto h-auto object-contain"
                                        style={{ display: 'block', margin: '0 auto' }}
                                    />
                                </div>
                            )}
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Description"
                                className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[80px]"
                                required
                            />
                            <div className="flex justify-end mt-2 z-20 relative">
                                <button
                                    type="submit"
                                    className={`px-5 py-1.5 rounded-full font-semibold shadow-md transition-colors text-sm
                                        ${submitting || !selectedImage || !description.trim()
                                            ? 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'}`}
                                    disabled={submitting || !selectedImage || !description.trim()}
                                >
                                    {submitting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default LeftNavigation; 