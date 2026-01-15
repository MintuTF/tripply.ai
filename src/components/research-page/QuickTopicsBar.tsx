'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Utensils,
  Landmark,
  Compass,
  Hotel,
  Lightbulb,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Topic {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  color: string;
}

const TOPICS: Topic[] = [
  {
    id: 'food',
    label: 'Food & Dining',
    icon: Utensils,
    prompt: 'Best restaurants and local food experiences',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'culture',
    label: 'Culture',
    icon: Landmark,
    prompt: 'Must-see cultural attractions and historical sites',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: Compass,
    prompt: 'Fun activities and unique experiences',
    color: 'from-green-500 to-teal-500',
  },
  {
    id: 'hotels',
    label: 'Where to Stay',
    icon: Hotel,
    prompt: 'Best hotels and accommodations',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'tips',
    label: 'Local Tips',
    icon: Lightbulb,
    prompt: 'Insider tips and travel advice',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'areas',
    label: 'Neighborhoods',
    icon: MapPin,
    prompt: 'Best areas and neighborhoods to explore',
    color: 'from-pink-500 to-rose-500',
  },
];

interface QuickTopicsBarProps {
  destination: string;
  onTopicSelect?: (topic: Topic) => void;
  selectedTopic?: string | null;
  className?: string;
}

export function QuickTopicsBar({
  destination,
  onTopicSelect,
  selectedTopic,
  className,
}: QuickTopicsBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollTo = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn('py-6 bg-card/50 backdrop-blur-sm border-b border-border/50', className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Research Topics
            </h2>
          </div>
          <p className="hidden sm:block text-sm text-muted-foreground">
            Click to explore {destination}
          </p>
        </div>

        {/* Topics Carousel */}
        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scrollTo('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full p-2 border border-border/50 hover:bg-background transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scrollTo('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full p-2 border border-border/50 hover:bg-background transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Gradient Fades */}
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-card/50 to-transparent pointer-events-none z-[5]" />
          )}
          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card/50 to-transparent pointer-events-none z-[5]" />
          )}

          {/* Scrollable Topics */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {TOPICS.map((topic, index) => {
              const Icon = topic.icon;
              const isSelected = selectedTopic === topic.id;

              return (
                <motion.button
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => onTopicSelect?.(topic)}
                  className={cn(
                    'relative flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-xl',
                    'transition-all duration-200',
                    'border',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-card hover:bg-accent border-border/50 hover:border-primary/30 hover:shadow-md'
                  )}
                >
                  {/* Gradient background on hover */}
                  {!isSelected && (
                    <div
                      className={cn(
                        'absolute inset-0 rounded-xl opacity-0 hover:opacity-10 transition-opacity bg-gradient-to-r',
                        topic.color
                      )}
                    />
                  )}

                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg',
                      isSelected
                        ? 'bg-primary-foreground/20'
                        : `bg-gradient-to-r ${topic.color}`
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isSelected ? 'text-primary-foreground' : 'text-white'
                      )}
                    />
                  </div>

                  <span
                    className={cn(
                      'font-medium whitespace-nowrap',
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    )}
                  >
                    {topic.label}
                  </span>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="topicIndicator"
                      className="absolute inset-0 rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default QuickTopicsBar;
