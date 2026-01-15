'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, MapPin, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recommendation {
  id: string;
  name: string;
  category: 'Must-See' | 'Hidden Gem' | 'Local Favorite' | 'Trending';
  description: string;
  why: string;
  image?: string;
  rating?: number;
}

interface AIRecommendationsProps {
  destination: string;
  recommendations?: Recommendation[];
  className?: string;
}

// Default recommendations based on destination
const DEFAULT_RECOMMENDATIONS: Record<string, Recommendation[]> = {
  'Tokyo': [
    {
      id: '1',
      name: 'Senso-ji Temple',
      category: 'Must-See',
      description: 'Tokyo\'s oldest temple with stunning architecture',
      why: 'Experience traditional Japanese culture in the heart of Asakusa',
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Shibuya Sky',
      category: 'Trending',
      description: 'Rooftop observation deck with 360° city views',
      why: 'Perfect sunset spot and Instagram-worthy panoramas',
      rating: 4.7,
    },
    {
      id: '3',
      name: 'Tsukiji Outer Market',
      category: 'Local Favorite',
      description: 'Fresh seafood and authentic Japanese street food',
      why: 'Where locals go for the best sushi breakfast',
      rating: 4.6,
    },
  ],
  'default': [
    {
      id: '1',
      name: 'Top Attraction',
      category: 'Must-See',
      description: 'Most popular landmark in the area',
      why: 'Highly rated by travelers worldwide',
      rating: 4.5,
    },
    {
      id: '2',
      name: 'Local Experience',
      category: 'Local Favorite',
      description: 'Authentic cultural experience',
      why: 'Experience the destination like a local',
      rating: 4.4,
    },
  ],
};

// Extract city name from destination string
function getCityName(destination: string): string {
  return destination.split(',')[0].trim();
}

// Get category color
function getCategoryColor(category: Recommendation['category']): string {
  switch (category) {
    case 'Must-See':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'Hidden Gem':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'Local Favorite':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'Trending':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

export function AIRecommendations({
  destination,
  recommendations: customRecommendations,
  className
}: AIRecommendationsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const cityName = getCityName(destination);
  const recommendations = customRecommendations ||
    DEFAULT_RECOMMENDATIONS[cityName] ||
    DEFAULT_RECOMMENDATIONS['default'];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-xl border border-border overflow-hidden',
        'bg-gradient-to-br from-primary/5 via-background to-secondary/5',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground text-sm">AI Picks for You</h3>
            <p className="text-xs text-muted-foreground">
              Curated for {cityName}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Recommendations List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border"
          >
            <div className="p-3 space-y-2">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative p-3 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        getCategoryColor(rec.category)
                      )}
                    >
                      {rec.category === 'Must-See' && <Star className="h-3 w-3" />}
                      {rec.category === 'Trending' && <TrendingUp className="h-3 w-3" />}
                      {rec.category === 'Local Favorite' && <MapPin className="h-3 w-3" />}
                      {rec.category}
                    </span>
                    {rec.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium text-foreground">
                          {rec.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name and Description */}
                  <h4 className="font-semibold text-sm text-foreground mb-1">
                    {rec.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {rec.description}
                  </p>

                  {/* AI Insight */}
                  <div className="flex items-start gap-2 p-2 rounded-md bg-accent/50 border border-border/50">
                    <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground italic">
                      {rec.why}
                    </p>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              ))}
            </div>

            {/* View All CTA */}
            <div className="p-3 pt-0">
              <button className="w-full py-2 px-4 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-xs font-medium text-muted-foreground hover:text-foreground">
                View All {recommendations.length > 3 ? '20+' : recommendations.length} Recommendations
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
