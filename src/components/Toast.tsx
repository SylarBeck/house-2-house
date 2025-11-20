import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info as InfoIcon } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const Toast: React.FC = () => {
    const { toasts, removeToast } = useToast();

    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <InfoIcon size={20} />
    };

    const colors = {
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200'
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${colors[toast.type]} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {icons[toast.type]}
                    </div>
                    <p className="flex-1 text-sm font-medium">{toast.message}</p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 hover:opacity-70 transition-opacity"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toast;
