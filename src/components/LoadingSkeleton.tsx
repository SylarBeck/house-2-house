import React from 'react';

interface LoadingSkeletonProps {
    type?: 'card' | 'list' | 'text' | 'circle';
    count?: number;
    className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    type = 'card',
    count = 1,
    className = ''
}) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-pulse ${className}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="flex gap-3 mb-4">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <div className="h-6 bg-gray-200 rounded w-12"></div>
                            <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="border-t pt-3 flex justify-between">
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className={`bg-white p-4 rounded-lg border border-gray-200 animate-pulse ${className}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div className={`animate-pulse ${className}`}>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                );

            case 'circle':
                return (
                    <div className={`w-12 h-12 bg-gray-200 rounded-full animate-pulse ${className}`}></div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index}>
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
};

export default LoadingSkeleton;
