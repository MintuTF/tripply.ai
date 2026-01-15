'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plane,
  ArrowLeft,
  Share2,
  Download,
  MoreHorizontal,
  Sun,
  Cloud,
  CloudRain,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Destination images for hero backgrounds
const DESTINATION_IMAGES: Record<string, string> = {
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80',
  'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1920&q=80',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80';

interface TripData {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  totalDays: number;
  activitiesCount: number;
  weather?: {
    temp: number;
    condition: 'sunny' | 'cloudy' | 'rainy';
  };
}

interface PlanHeroProps {
  trip: TripData;
  onBack?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  className?: string;
}

export function PlanHero({
  trip,
  onBack,
  onShare,
  onExport,
  className,
}: PlanHeroProps) {
  const heroImage = DESTINATION_IMAGES[trip.destination] || DEFAULT_IMAGE;

  const WeatherIcon = trip.weather?.condition === 'sunny'
    ? Sun
    : trip.weather?.condition === 'rainy'
    ? CloudRain
    : Cloud;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'relative h-[40vh] min-h-[320px] max-h-[450px] overflow-hidden',
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt={trip.destination}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      </div>

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link
                href="/trips"
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">My Trips</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={onShare}
                className="p-2.5 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={onExport}
                className="p-2.5 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20"
              >
                <Download className="h-5 w-5" />
              </button>
              <button className="p-2.5 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          {/* Trip Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-3"
          >
            <div className="flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium">
              <Plane className="h-4 w-4" />
              <span>Planning in Progress</span>
            </div>
          </motion.div>

          {/* Destination Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            {trip.destination}
          </motion.h1>

          {/* Trip Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-3"
          >
            {/* Date Range */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
              <Calendar className="h-5 w-5 text-blue-300" />
              <span className="font-medium">
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
              <Clock className="h-5 w-5 text-amber-300" />
              <span className="font-medium">{trip.totalDays} days</span>
            </div>

            {/* Travelers */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
              <Users className="h-5 w-5 text-green-300" />
              <span className="font-medium">
                {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
              </span>
            </div>

            {/* Activities Count */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
              <MapPin className="h-5 w-5 text-rose-300" />
              <span className="font-medium">{trip.activitiesCount} activities</span>
            </div>

            {/* Weather (if available) */}
            {trip.weather && (
              <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
                <WeatherIcon className="h-5 w-5 text-yellow-300" />
                <span className="font-medium">{trip.weather.temp}°C</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default PlanHero;
