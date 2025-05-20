"use client";
import { useEffect } from 'react';
import { useToast } from './ToastProvider';
import { useLoginModal } from '@/context/LoginModalContext';
import { setApi401Handlers } from '@/services/api401';

export default function Api401Provider({ children }: { children: React.ReactNode }) {
    const { showToast } = useToast();
    const { openLoginModal } = useLoginModal();

    useEffect(() => {
        setApi401Handlers(showToast, openLoginModal);
    }, [showToast, openLoginModal]);

    return <>{children}</>;
} 