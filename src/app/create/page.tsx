'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Create() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:5000/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error('Failed to generate image');

            const data = await response.json();
            setGeneratedImage(data.imageUrl);
        } catch (error) {
            console.error('Error generating image:', error);
            // Handle error appropriately
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">Create AI Art</h1>
                <p className="text-gray-600">
                    Describe what you want to create, and our AI will bring it to life
                </p>
            </div>

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
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Generating...' : 'Generate Art'}
                    </button>
                </div>
            </form>

            {generatedImage && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">Your Creation</h2>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                            src={`http://localhost:5000/post_pics/${generatedImage}`}
                            alt="Generated art"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => {
                                // Implement download functionality
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Download
                        </button>
                        <button
                            onClick={() => {
                                // Implement share functionality
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Share to Gallery
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 