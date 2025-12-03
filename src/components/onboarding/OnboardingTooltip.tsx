'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingStep } from '@/hooks/useOnboarding';

interface OnboardingTooltipProps {
  step: OnboardingStep;
  isVisible: boolean;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  targetRef: React.RefObject<HTMLElement | null>;
  onComplete: () => void;
  onDismiss: () => void;
  stepNumber: number;
  totalSteps: number;
}

export function OnboardingTooltip({
  isVisible,
  title,
  description,
  position = 'bottom',
  targetRef,
  onComplete,
  onDismiss,
  stepNumber,
  totalSteps,
}: OnboardingTooltipProps) {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position relative to target element
  useEffect(() => {
    if (!isVisible || !targetRef.current || !mounted) return;

    const updatePosition = () => {
      const targetRect = targetRef.current?.getBoundingClientRect();
      if (!targetRect) return;

      const tooltipWidth = 280;
      const tooltipHeight = 140;
      const arrowSize = 8;
      const offset = 12;

      let top = 0;
      let left = 0;
      let arrowTop = 0;
      let arrowLeft = 0;

      switch (position) {
        case 'bottom':
          top = targetRect.bottom + offset;
          left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          arrowTop = -arrowSize;
          arrowLeft = tooltipWidth / 2 - arrowSize;
          break;
        case 'top':
          top = targetRect.top - tooltipHeight - offset;
          left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          arrowTop = tooltipHeight;
          arrowLeft = tooltipWidth / 2 - arrowSize;
          break;
        case 'left':
          top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
          left = targetRect.left - tooltipWidth - offset;
          arrowTop = tooltipHeight / 2 - arrowSize;
          arrowLeft = tooltipWidth;
          break;
        case 'right':
          top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
          left = targetRect.right + offset;
          arrowTop = tooltipHeight / 2 - arrowSize;
          arrowLeft = -arrowSize * 2;
          break;
      }

      // Keep tooltip within viewport
      const padding = 16;
      if (left < padding) left = padding;
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }
      if (top < padding) top = padding;
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = window.innerHeight - tooltipHeight - padding;
      }

      setTooltipStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${tooltipWidth}px`,
        zIndex: 9999,
      });

      setArrowStyle({
        position: 'absolute',
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, targetRef, position, mounted]);

  if (!isVisible || !mounted) return null;

  const arrowRotation = {
    top: 'rotate-180',
    bottom: 'rotate-0',
    left: 'rotate-90',
    right: '-rotate-90',
  };

  const tooltipContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[9998]"
        onClick={onDismiss}
      />

      {/* Highlight target area */}
      {targetRef.current && (
        <div
          className="fixed z-[9998] ring-4 ring-primary/50 rounded-lg pointer-events-none"
          style={{
            top: targetRef.current.getBoundingClientRect().top - 4,
            left: targetRef.current.getBoundingClientRect().left - 4,
            width: targetRef.current.getBoundingClientRect().width + 8,
            height: targetRef.current.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-card border border-border rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {/* Arrow */}
        <div style={arrowStyle} className={cn('w-0 h-0', arrowRotation[position])}>
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-card" />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {stepNumber}
              </span>
              <h4 className="font-semibold text-foreground">{title}</h4>
            </div>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 pl-7">
            {description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pl-7">
            <span className="text-xs text-muted-foreground">
              {stepNumber} of {totalSteps}
            </span>
            <button
              onClick={onComplete}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Got it
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(tooltipContent, document.body);
}

// Pre-defined tooltip configurations
export const ONBOARDING_TOOLTIPS: Record<
  OnboardingStep,
  { title: string; description: string; position: 'top' | 'bottom' | 'left' | 'right' }
> = {
  'search-places': {
    title: 'Search for places',
    description: 'Type a location or place name to find restaurants, attractions, and hotels to add to your trip.',
    position: 'bottom',
  },
  'add-to-trip': {
    title: 'Add to your trip',
    description: 'Click the + button to add places you like to your trip board for planning.',
    position: 'left',
  },
  'view-board': {
    title: 'Organize your trip',
    description: 'Switch to Board view to organize your places into categories and plan your itinerary.',
    position: 'bottom',
  },
  'save-trip': {
    title: 'Save your trip',
    description: 'When ready, save your trip to keep it forever and share with travel companions.',
    position: 'bottom',
  },
};
