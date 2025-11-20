import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const PULL_THRESHOLD = 80;
    const MAX_PULL = 120;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY === 0 || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, Math.min(currentY - startY, MAX_PULL));

        if (distance > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
            setPullDistance(distance);
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    };

    const progress = Math.min((pullDistance / PULL_THRESHOLD) * 100, 100);

    return (
        <div
            ref={containerRef}
            className="relative overflow-auto h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
                style={{
                    height: `${Math.min(pullDistance, MAX_PULL)}px`,
                    opacity: pullDistance > 10 ? 1 : 0,
                }}
            >
                <div className="bg-white rounded-full p-2 shadow-lg">
                    <RefreshCw
                        size={24}
                        className={`text-gray-600 transition-transform ${isRefreshing ? 'animate-spin' : ''
                            }`}
                        style={{
                            transform: isRefreshing ? '' : `rotate(${progress * 3.6}deg)`
                        }}
                    />
                </div>
            </div>

            {/* Content */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: `translateY(${pullDistance}px)`
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
