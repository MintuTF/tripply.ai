'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  placeName: string;
  placeId: string;
  isSaved?: boolean;
  onSaveToggle?: () => void;
}

export function Header({ placeName, placeId, isSaved = false, onSaveToggle }: HeaderProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: placeName,
          text: `Check out ${placeName}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-100/50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 text-gray-700 hover:from-purple-100 hover:to-pink-100 transition-all group border border-purple-100/50"
        >
          <ChevronLeft className="w-5 h-5 text-purple-600 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-medium text-gray-700">Back</span>
        </button>

        {/* Place Name (visible on scroll) */}
        <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate max-w-md hidden sm:block">
          {placeName}
        </h1>

        {/* Actions */}
        <div className="flex gap-2">
          {onSaveToggle && (
            <button
              onClick={onSaveToggle}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm',
                isSaved
                  ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-purple-200'
                  : 'bg-gradient-to-br from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100 border border-purple-100'
              )}
              aria-label={isSaved ? 'Unsave place' : 'Save place'}
            >
              <Heart className={cn('w-5 h-5', isSaved && 'fill-current')} />
            </button>
          )}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100 flex items-center justify-center transition-all disabled:opacity-50 border border-purple-100 shadow-sm"
            aria-label="Share place"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
