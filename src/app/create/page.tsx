'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { FaImage } from 'react-icons/fa';
import { IMAGE_CONFIG } from '@/config';
import { useToast } from '@/components/ToastProvider';
import Modal from '@/components/Modal';
import { userService, User } from '@/services/user';

export default function Create() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const { showToast } = useToast();
    const [tokens, setTokens] = useState<number | null>(null);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [aiCreations, setAiCreations] = useState<any[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiPage, setAiPage] = useState(1);
    const [aiTotalPages, setAiTotalPages] = useState(1);
    const aiLoadMoreRef = useRef<HTMLDivElement | null>(null);
    const [selectedAiCreation, setSelectedAiCreation] = useState<any | null>(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiModalLoading, setAiModalLoading] = useState(false);
    const [aiModalError, setAiModalError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Add a function to fetch tokens
    const fetchTokens = useCallback(() => {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) {
            setTokens(null);
            setTokenError('You must be logged in to see your generation tokens.');
            return;
        }
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169'}/api/Image/generation-tokens`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*',
            },
        })
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch tokens'))
            .then(data => {
                setTokens(data.generationTokens);
                setTokenError(null);
            })
            .catch(() => {
                setTokens(null);
                setTokenError('Failed to fetch generation tokens.');
            });
    }, []);

    // Fetch user profile (with posts) for share-to-gallery logic
    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await userService.getProfile();
            if (response.success && response.data) {
                setUser(response.data);
            }
        } catch { }
    }, []);

    useEffect(() => {
        fetchTokens();
        fetchUserProfile();
    }, [fetchTokens, fetchUserProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) {
            showToast('You must be logged in to create AI images.', 'error');
            return;
        }
        setIsGenerating(true);
        setGeneratedImage(null);
        setImageLoaded(false);
        try {
            const response = await fetch('http://localhost:5169/api/Image/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*',
                },
                body: JSON.stringify({ prompt }),
            });
            if (!response.ok) throw new Error('Failed to generate image');
            const data = await response.json();
            setGeneratedImage(data.imageUrl);
            // Update tokens and creations after successful generation
            fetchTokens();
            fetchAiCreations(1);
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Fetch AI creations
    const fetchAiCreations = useCallback(async (page = 1) => {
        setAiLoading(true);
        setAiError(null);
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169'}/api/Image?page=${page}&pageSize=12`, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '', 'accept': '*/*' },
            });
            if (!res.ok) throw new Error('Failed to fetch AI creations');
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setAiCreations(prev => page === 1 ? data.data : [...prev, ...data.data]);
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
        fetchAiCreations(1);
    }, [fetchAiCreations]);

    // Infinite scroll for AI creations
    useEffect(() => {
        if (aiPage >= aiTotalPages) return;
        const node = aiLoadMoreRef.current;
        if (!node) return;
        let didCancel = false;
        const observer = new window.IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !didCancel && !aiLoading && aiPage < aiTotalPages) {
                fetchAiCreations(aiPage + 1);
            }
        }, { rootMargin: '200px' });
        observer.observe(node);
        return () => {
            didCancel = true;
            observer.disconnect();
        };
    }, [aiPage, aiTotalPages, aiLoading, fetchAiCreations]);

    // Fetch AI creation details
    const handleAiCreationClick = async (id: string) => {
        setAiModalLoading(true);
        setAiModalError(null);
        setAiModalOpen(true);
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169'}/api/Image/${id}`, {
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

    // After sharing to gallery, refresh posts and creations
    const handleShareToGallery = async (aiCreation: any) => {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        try {
            const imageUrl = `${IMAGE_CONFIG.AI_PICTURE_URL}/${aiCreation.imageUrl}`;
            const imageResp = await fetch(imageUrl);
            const imageBlob = await imageResp.blob();
            const formData = new FormData();
            formData.append('Description', aiCreation.prompt);
            formData.append('Picture', imageBlob, aiCreation.imageUrl || 'ai-image.webp');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169'}/api/Post/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: formData,
            });
            if (response.ok) {
                showToast('Image saved to gallery!', 'success');
                fetchAiCreations(1);
                fetchUserProfile();
            } else {
                showToast('Failed to save image to gallery.', 'error');
            }
        } catch (err) {
            showToast('Failed to save image to gallery.', 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
            {/* Centered Title and Subtitle */}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900">Create AI Art</h1>
                <p className="text-gray-600 mt-2">
                    Describe what you want to create, and our AI will bring it to life
                </p>
            </div>
            <div className="flex flex-col md:flex-row gap-40">
                {/* Left: Tokens, Create Form & Preview */}
                <div className="flex-1 min-w-0">
                    {/* Tokens at the top */}
                    {(tokens !== null || tokenError) && (
                        <div className="flex justify-start mb-6">
                            {tokens !== null && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-white text-gray-500 border border-gray-200 text-sm font-medium cursor-default select-none">
                                    {tokens} tokens
                                </span>
                            )}
                            {tokenError && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-white text-red-500 border border-gray-200 text-sm font-medium cursor-default select-none">
                                    {tokenError}
                                </span>
                            )}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                                Describe your image
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="prompt"
                                    name="prompt"
                                    rows={4}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm"
                                    placeholder="A serene landscape with mountains and a lake at sunset..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={isGenerating}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Art'}
                            </button>
                        </div>
                    </form>
                    <div className="flex justify-center mt-8">
                        <div className="relative w-[320px] h-[320px] sm:w-[384px] sm:h-[384px] md:w-[400px] md:h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                            {/* Placeholder */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${generatedImage && imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
                                <FaImage className="w-20 h-20 text-gray-300 animate-pulse mb-4" />
                                <span className="text-gray-400 text-lg font-medium">Your AI image will appear here</span>
                            </div>
                            {/* Spinner overlay */}
                            {isGenerating && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                                    <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                </div>
                            )}
                            {/* Generated image */}
                            {generatedImage && (
                                <img
                                    src={`${IMAGE_CONFIG.AI_PICTURE_URL}/${generatedImage}`}
                                    alt="Generated art"
                                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setImageLoaded(true)}
                                />
                            )}
                        </div>
                    </div>
                    {generatedImage && imageLoaded && (
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                onClick={async () => {
                                    const url = `${IMAGE_CONFIG.AI_PICTURE_URL}/${generatedImage}`;
                                    const response = await fetch(url);
                                    const blob = await response.blob();
                                    const link = document.createElement('a');
                                    link.href = window.URL.createObjectURL(blob);
                                    link.download = generatedImage || 'ai-image.webp';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Download
                            </button>
                            <button
                                onClick={async () => {
                                    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
                                    try {
                                        const imageUrl = `${IMAGE_CONFIG.AI_PICTURE_URL}/${generatedImage}`;
                                        const imageResp = await fetch(imageUrl);
                                        const imageBlob = await imageResp.blob();
                                        const formData = new FormData();
                                        formData.append('Description', prompt);
                                        formData.append('Picture', imageBlob, generatedImage || 'ai-image.webp');
                                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169'}/api/Post/posts`, {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': token ? `Bearer ${token}` : '',
                                            },
                                            body: formData,
                                        });
                                        if (response.ok) {
                                            showToast('Image saved to gallery!', 'success');
                                        } else {
                                            showToast('Failed to save image to gallery.', 'error');
                                        }
                                    } catch (err) {
                                        showToast('Failed to save image to gallery.', 'error');
                                    }
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Share to Gallery
                            </button>
                        </div>
                    )}
                </div>
                {/* Right: My Creations */}
                <div className="w-full md:w-[400px] lg:w-[440px] xl:w-[480px] flex-shrink-0 md:pl-8 lg:pl-16">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">My Creations</h2>
                    </div>
                    <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                        {aiCreations.map((item) => (
                            <div key={item.id} className="mb-4 break-inside-avoid group relative rounded-xl overflow-hidden bg-white shadow hover:shadow-lg cursor-pointer transition-all border border-gray-100"
                                onClick={() => handleAiCreationClick(item.id)}
                            >
                                <Image
                                    src={`${IMAGE_CONFIG.AI_PICTURE_URL}/${item.imageUrl}`}
                                    alt={item.prompt}
                                    width={400}
                                    height={400}
                                    className="w-full h-auto object-cover"
                                />
                                <div className="p-2">
                                    <p className="text-xs text-gray-800 mb-1 truncate">{item.prompt}</p>
                                    <div className="flex gap-2 text-[11px] text-gray-500 mt-1">
                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {aiLoading && Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="mb-4 break-inside-avoid rounded-xl bg-gray-200 animate-pulse h-[180px] w-full max-w-[400px] mx-auto shadow" />
                        ))}
                        <div ref={aiLoadMoreRef} className="w-full flex justify-center py-4" />
                    </div>
                    {aiError && <div className="text-red-500 mt-4">{aiError}</div>}
                    {aiCreations.length === 0 && !aiLoading && !aiError && (
                        <div className="text-gray-500">No AI creations yet.</div>
                    )}
                </div>
            </div>
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
                            {user && user.posts.some(post => post.description === selectedAiCreation.prompt) ? (
                                <button
                                    disabled
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                                    title="Already posted to gallery"
                                >
                                    Already in Gallery
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleShareToGallery(selectedAiCreation)}
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