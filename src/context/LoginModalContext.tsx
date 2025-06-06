"use client";

import { createContext, useContext, useState, type ReactNode } from 'react';

interface LoginModalContextType {
    isOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const openLoginModal = () => setIsOpen(true);
    const closeLoginModal = () => setIsOpen(false);

    return (
        <LoginModalContext.Provider value={{ isOpen, openLoginModal, closeLoginModal }}>
            {children}
        </LoginModalContext.Provider>
    );
}

export function useLoginModal() {
    const context = useContext(LoginModalContext);
    if (!context) {
        throw new Error('useLoginModal must be used within a LoginModalProvider');
    }
    return context;
} 