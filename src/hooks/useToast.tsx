import React, { useState, useCallback } from 'react';

interface ToastConfig {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

let toastCount = 0;

const ToastContext = React.createContext<{
    toasts: ToastConfig[];
    showToast: (message: string, type?: ToastConfig['type'], duration?: number) => void;
    removeToast: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastConfig[]>([]);

    const showToast = useCallback((message: string, type: ToastConfig['type'] = 'info', duration = 3000) => {
        const id = `toast-${++toastCount}`;
        const toast: ToastConfig = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
