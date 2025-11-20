import React, { useState, useCallback, createContext } from 'react';

export interface ToastConfig {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

interface ToastContextType {
    toasts: ToastConfig[];
    showToast: (message: string, type?: ToastConfig['type'], duration?: number) => void;
    removeToast: (id: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextType | null>(null);

let toastCount = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastConfig[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastConfig['type'] = 'info', duration = 3000) => {
        const id = `toast-${++toastCount}`;
        const toast: ToastConfig = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
}
