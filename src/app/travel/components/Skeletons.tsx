'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
      {/* Image skeleton */}
      <Skeleton className="h-40 w-full" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4 rounded" />

        {/* Rating and categories */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
        </div>
      </div>
    </div>
  );
}

export function PlacesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PlaceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DrawerSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Hero image skeleton */}
      <Skeleton className="h-56 w-full" />

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Title and rating */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/3 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>

        {/* Quick info badges */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        {/* Mini map */}
        <Skeleton className="h-32 w-full rounded-xl" />

        {/* Action buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-24 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>

        {/* Why visit section */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/2 rounded" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-gray-200', className)}>
      <Skeleton className="absolute inset-0" />
    </div>
  );
}

export function CitySummarySkeleton() {
  return (
    <div className="relative h-48 bg-gray-200">
      <Skeleton className="absolute inset-0" />
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <Skeleton className="h-6 w-24 rounded mb-4" />

        {/* City info */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>

        <Skeleton className="h-10 w-48 rounded mb-3" />

        {/* Badges */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
