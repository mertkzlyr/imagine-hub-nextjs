"use client";
import React, { createContext, useContext, useState } from 'react';

interface LoginModalContextType {
    isOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export const LoginModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const openLoginModal = () => setIsOpen(true);
    const closeLoginModal = () => setIsOpen(false);
    return (
        <LoginModalContext.Provider value={{ isOpen, openLoginModal, closeLoginModal }}>
            {children}
        </LoginModalContext.Provider>
    );
};

export const useLoginModal = () => {
    const context = useContext(LoginModalContext);
    if (!context) throw new Error('useLoginModal must be used within a LoginModalProvider');
    return context;
}; 