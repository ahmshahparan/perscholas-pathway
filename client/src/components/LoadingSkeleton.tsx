import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'text' | 'avatar' | 'table';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  count = 1,
  className = '' 
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <div className={`space-y-4 ${className}`} role="status" aria-label="Loading content">
        {skeletons.map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="skeleton h-6 w-3/4"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-5/6"></div>
            <div className="flex gap-2 mt-4">
              <div className="skeleton h-8 w-20"></div>
              <div className="skeleton h-8 w-20"></div>
            </div>
          </div>
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-label="Loading list">
        {skeletons.map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-12 w-12 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4"></div>
              <div className="skeleton h-3 w-1/2"></div>
            </div>
          </div>
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={`space-y-2 ${className}`} role="status" aria-label="Loading text">
        {skeletons.map((i) => (
          <div key={i} className="skeleton h-4 w-full"></div>
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (type === 'avatar') {
    return (
      <div className={`flex items-center gap-3 ${className}`} role="status" aria-label="Loading profile">
        <div className="skeleton h-16 w-16 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-32"></div>
          <div className="skeleton h-4 w-24"></div>
        </div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-label="Loading table">
        <div className="skeleton h-10 w-full"></div>
        {skeletons.map((i) => (
          <div key={i} className="skeleton h-16 w-full"></div>
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return null;
};

