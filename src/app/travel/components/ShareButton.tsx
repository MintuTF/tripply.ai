'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Copy,
  Check,
  Twitter,
  Facebook,
  Mail,
  MessageCircle,
  X,
} from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  place: TravelPlace;
  cityName?: string;
  className?: string;
  variant?: 'icon' | 'button';
}

export function ShareButton({
  place,
  cityName,
  className,
  variant = 'icon',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/travel?place=${place.id}`
    : '';

  const shareText = `Check out ${place.name}${cityName ? ` in ${cityName}` : ''} - ${place.rating} stars!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(`Check out ${place.name}`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
    },
  ];

  return (
    <>
      {/* Share Button */}
      {variant === 'icon' ? (
        <button
          onClick={handleNativeShare}
          className={cn(
            'w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors',
            className
          )}
          title="Share"
        >
          <Share2 className="w-5 h-5 text-gray-700" />
        </button>
      ) : (
        <button
          onClick={handleNativeShare}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-purple-200 text-purple-700 font-medium hover:bg-purple-50 transition-colors',
            className
          )}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[60] p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Share {place.name}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Social Share Buttons */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-white transition-colors',
                      link.color
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="text-xs">{link.name}</span>
                  </a>
                ))}
              </div>

              {/* Copy Link */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-sm text-gray-700 truncate"
                />
                <button
                  onClick={handleCopy}
                  className={cn(
                    'px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2',
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
