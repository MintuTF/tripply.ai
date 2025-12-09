'use client';

import { cn } from '@/lib/utils';

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

function getRatingInfo(rating: number): { label: string; colorClass: string } {
  if (rating >= 9.0) {
    return { label: 'Excellent', colorClass: 'bg-green-500' };
  } else if (rating >= 8.0) {
    return { label: 'Very good', colorClass: 'bg-blue-500' };
  } else if (rating >= 7.0) {
    return { label: 'Good', colorClass: 'bg-yellow-500' };
  } else {
    return { label: 'Fair', colorClass: 'bg-gray-400' };
  }
}

export function RatingBadge({ rating, reviewCount, size = 'md' }: RatingBadgeProps) {
  const { label, colorClass } = getRatingInfo(rating);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md font-bold text-white',
          colorClass,
          sizeClasses[size]
        )}
      >
        <span>{rating.toFixed(1)}</span>
        <span className="font-medium">{label}</span>
      </span>
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-sm text-muted-foreground">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
