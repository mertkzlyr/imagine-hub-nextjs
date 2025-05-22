interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50" onClick={onClose}>
            {/* Backdrop with blur effect */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
            />

            {/* Modal content */}
            <div className="fixed inset-0 z-50 overflow-y-auto flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div
                    className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
} 