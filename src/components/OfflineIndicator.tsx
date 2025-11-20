import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWA';

const OfflineIndicator: React.FC = () => {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-md">
            <WifiOff size={16} />
            <span>You're offline. Changes will sync when you're back online.</span>
        </div>
    );
};

export default OfflineIndicator;
