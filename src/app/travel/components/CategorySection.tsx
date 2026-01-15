'use client';

import { ArrowRight } from 'lucide-react';
import { PlaceCarousel } from './PlaceCarousel';
import type { TravelPlace } from '@/lib/travel/types';
import type { LucideIcon } from 'lucide-react';

interface CategorySectionProps {
  category: 'hotels' | 'restaurants' | 'activities';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  places: TravelPlace[];
  onPlaceClick: (place: TravelPlace) => void;
  onViewAll: () => void;
}

export function CategorySection({
  category,
  title,
  subtitle,
  icon: Icon,
  places,
  onPlaceClick,
  onViewAll,
}: CategorySectionProps) {
  return (
    <section id={`section-${category}`} className="space-y-6" aria-labelledby={`${category}-heading`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Title & Subtitle */}
          <div>
            <h2 id={`${category}-heading`} className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>

        {/* View All Link */}
        {places.length > 0 && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors group"
          >
            <span className="text-sm font-medium group-hover:underline">View all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Carousel */}
      <PlaceCarousel places={places} onPlaceClick={onPlaceClick} />
    </section>
  );
}
