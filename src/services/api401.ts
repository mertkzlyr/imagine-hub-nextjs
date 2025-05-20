// Singleton 401 handler for API services
let showToast: ((msg: string, type: 'success' | 'error') => void) | null = null;
let openLoginModal: (() => void) | null = null;

export function setApi401Handlers(
    toastFn: (msg: string, type: 'success' | 'error') => void,
    modalFn: () => void
) {
    showToast = toastFn;
    openLoginModal = modalFn;
}

export function handleApi401(response: Response) {
    if (response.status === 401 && showToast && openLoginModal) {
        showToast('You need to log in to continue.', 'error');
        openLoginModal();
        return true;
    }
    return false;
} 