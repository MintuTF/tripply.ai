'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';
import { ChatMapSidebar } from './ChatMapSidebar';
import { useState } from 'react';

interface MapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  places: PlaceCard[];
  center: { lat: number; lng: number };
  onPlaceClick?: (place: PlaceCard) => void;
  className?: string;
}

export function MapDrawer({
  isOpen,
  onClose,
  places,
  center,
  onPlaceClick,
  className,
}: MapDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlaceClick = (place: PlaceCard) => {
    onClose();
    // Delay to allow drawer close animation
    setTimeout(() => {
      onPlaceClick?.(place);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{
              y: '100%',  // Mobile: slide from bottom
              x: '100%',  // Desktop: slide from right
            }}
            animate={{
              y: 0,
              x: 0,
            }}
            exit={{
              y: '100%',
              x: '100%',
            }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className={cn(
              'fixed z-50 bg-background shadow-2xl',
              // Mobile: bottom drawer
              'bottom-0 left-0 right-0 rounded-t-3xl',
              isExpanded ? 'h-[90vh]' : 'h-[60vh]',
              // Desktop: side panel
              'md:top-0 md:right-0 md:bottom-0 md:left-auto md:rounded-none md:rounded-l-3xl',
              'md:w-[500px] md:h-full',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              {/* Mobile: Drag Handle */}
              <div className="md:hidden pt-3 pb-2 flex justify-center">
                <div className="w-12 h-1.5 rounded-full bg-border/50" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Map View</h3>
                  <span className="text-sm text-muted-foreground">
                    ({places.length} {places.length === 1 ? 'place' : 'places'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile: Expand/Collapse */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="md:hidden p-2 hover:bg-accent rounded-lg transition-all duration-200 active:scale-95"
                    title={isExpanded ? 'Minimize' : 'Maximize'}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-5 h-5" />
                    ) : (
                      <Maximize2 className="w-5 h-5" />
                    )}
                  </button>

                  {/* Close */}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-accent rounded-lg transition-all duration-200 active:scale-95"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Map Content */}
              <div className="flex-1 overflow-hidden">
                <ChatMapSidebar
                  places={places}
                  center={center}
                  onPlaceClick={handlePlaceClick}
                  className="h-full"
                />
              </div>

              {/* Mobile: Footer with hints */}
              <div className="md:hidden px-4 py-3 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  Tap a marker to view place details
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
