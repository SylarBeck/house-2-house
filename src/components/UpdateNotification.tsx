import React from 'react';
import { RefreshCw } from 'lucide-react';

interface UpdateNotificationProps {
    onUpdate: () => void;
    onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate, onDismiss }) => {
    return (
        <div className="fixed bottom-20 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl border-2 border-green-200 p-4 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                        <RefreshCw size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">Update Available</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            A new version is available. Refresh to update.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={onUpdate}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
                            >
                                Update Now
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
            </div>
        </div>
    );
};

export default UpdateNotification;
