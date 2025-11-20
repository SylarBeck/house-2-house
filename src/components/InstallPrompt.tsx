import React from 'react';
import { X, Download } from 'lucide-react';

interface InstallPromptProps {
    onInstall: () => void;
    onDismiss: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
    return (
        <div className="fixed top-4 left-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-4 max-w-md mx-auto">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                            <Download size={24} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">Install App</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Add H2H Record to your home screen for a better experience!
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={onInstall}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                                >
                                    Install
                                </button>
                                <button
                                    onClick={onDismiss}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
                                >
                                    Later
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
