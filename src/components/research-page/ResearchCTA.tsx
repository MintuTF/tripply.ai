'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Calendar, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResearchCTAProps {
  destination: string;
  savedCount?: number;
  onBuildItinerary?: () => void;
  onViewMap?: () => void;
  className?: string;
}

export function ResearchCTA({
  destination,
  savedCount = 0,
  onBuildItinerary,
  onViewMap,
  className,
}: ResearchCTAProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className={cn('py-20 relative overflow-hidden', className)}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.8 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg mb-8"
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
          Ready to plan your
          <br />
          <span className="text-primary">{destination} adventure?</span>
        </h2>

        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          {savedCount > 0 ? (
            <>
              You've saved <span className="text-foreground font-semibold">{savedCount} places</span> to visit.
              Turn them into the perfect day-by-day itinerary.
            </>
          ) : (
            <>
              Discover amazing places, save your favorites, and build a personalized
              itinerary for your trip to {destination}.
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBuildItinerary}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Calendar className="h-5 w-5" />
            Build Your Itinerary
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewMap}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-card border border-border hover:border-primary/30 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg transition-all"
          >
            <Map className="h-5 w-5" />
            Explore on Map
          </motion.button>
        </div>

        {/* Stats */}
        {savedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{savedCount} places saved</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>AI-optimized routing</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

export default ResearchCTA;
