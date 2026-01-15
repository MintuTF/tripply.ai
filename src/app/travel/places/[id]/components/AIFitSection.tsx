'use client';

import { Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIFitSectionProps {
  placeName: string;
  reasons?: string[];
  isLoading?: boolean;
}

interface ReasonCardProps {
  title: string;
  description: string;
  index: number;
}

function ReasonCard({ title, description, index }: ReasonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-purple-100"
    >
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Check className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function AIFitSection({ placeName, reasons, isLoading = false }: AIFitSectionProps) {
  // Default reasons if none provided
  const defaultReasons = [
    {
      title: 'Perfect for your travel style',
      description: 'This destination matches your preferences and interests based on your trip profile.',
    },
    {
      title: 'Ideal timing for your itinerary',
      description: 'Best visited on Day 1 or 2, allowing 2-3 hours to fully experience everything.',
    },
    {
      title: 'Complements your other activities',
      description: 'Pairs well with nearby attractions and restaurants for a complete day experience.',
    },
  ];

  const displayReasons = reasons && reasons.length > 0
    ? reasons.slice(0, 3).map((reason, index) => ({
        title: `Reason ${index + 1}`,
        description: reason,
      }))
    : defaultReasons;

  return (
    <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-start gap-4 mb-8">
          {/* AI Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Why {placeName} fits your trip
            </h2>
            <p className="text-gray-600">
              AI-powered recommendations based on your travel preferences
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-gray-600 text-sm">Analyzing why this place is perfect for you...</p>
            </div>
          </div>
        ) : (
          /* Reason Cards */
          <div className="space-y-4">
            {displayReasons.map((reason, index) => (
              <ReasonCard
                key={index}
                title={reason.title}
                description={reason.description}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
