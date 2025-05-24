'use client';

import { useState, useEffect } from 'react';
import { AUTH_CONFIG } from '@/config';

interface AuthenticatedImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    onError?: () => void;
}

export default function AuthenticatedImage({ src, alt, className, style, onError }: AuthenticatedImageProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!src) {
            setImageSrc(null);
            return;
        }

        const fetchImage = async () => {
            try {
                const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
                const response = await fetch(src, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch image');
                }

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                setImageSrc(objectUrl);
            } catch (error) {
                console.error('Error loading image:', error);
                onError?.();
            }
        };

        fetchImage();

        return () => {
            if (imageSrc) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [src, onError]);

    if (!imageSrc) {
        return null;
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            style={style}
            onError={() => {
                console.error('Error loading image');
                onError?.();
            }}
        />
    );
} 