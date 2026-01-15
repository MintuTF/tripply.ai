'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTripContext } from '@/context/TripContext';
import { getTripContextSummary } from '@/lib/marketplace/tripContextUtils';

interface SmartAssistantCardProps {
  onCheckComplete?: (missingItems: string[]) => void;
}

export function SmartAssistantCard({ onCheckComplete }: SmartAssistantCardProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [checklist, setChecklist] = useState<{
    category: string;
    items: string[];
    status: 'complete' | 'missing';
  }[]>([]);

  const { trip, cards } = useTripContext();
  const tripSummary = getTripContextSummary(trip);

  // Simulate AI checklist generation
  const handleCheckTrip = async () => {
    setIsChecking(true);
    setShowResults(false);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate checklist based on trip context
    const productCards = cards?.filter(card => card.type === 'product') || [];
    const productCategories = new Set(
      productCards.map(card => (card.payload_json as any)?.category).filter(Boolean)
    );

    // Essential categories for any trip
    const essentialCategories = [
      { category: 'Electronics', items: ['Universal adapter', 'Portable charger', 'Phone cable'] },
      { category: 'Toiletries', items: ['TSA-approved bottles', 'Travel-size toiletries'] },
      { category: 'Documents', items: ['Passport copies', 'Travel insurance'] },
      { category: 'Safety', items: ['First aid kit', 'Luggage locks'] },
    ];

    // Add weather-specific items
    if (tripSummary?.season === 'Winter') {
      essentialCategories.push({
        category: 'Winter gear',
        items: ['Warm jacket', 'Gloves', 'Thermal layers']
      });
    } else if (tripSummary?.season === 'Summer') {
      essentialCategories.push({
        category: 'Sun protection',
        items: ['Sunscreen', 'Sunglasses', 'Hat']
      });
    }

    // Check what's missing
    const results = essentialCategories.map(({ category, items }) => {
      const hasCategory = productCategories.has(category.toLowerCase());
      return {
        category,
        items,
        status: hasCategory ? 'complete' as const : 'missing' as const
      };
    });

    setChecklist(results);
    setShowResults(true);
    setIsChecking(false);

    // Callback with missing items
    const missingItems = results
      .filter(r => r.status === 'missing')
      .flatMap(r => r.items);
    onCheckComplete?.(missingItems);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="max-w-2xl mx-auto"
    >
      {!showResults ? (
        // Initial Card
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                💡 Need a hand?
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Want me to check if you're missing anything for{' '}
                {tripSummary?.destination ? `your trip to ${tripSummary.destination}` : 'this trip'}?
              </p>

              <button
                onClick={handleCheckTrip}
                disabled={isChecking}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-70"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check My Trip</span>
                  </>
                )}
              </button>

              {/* Trust indicator */}
              <p className="text-xs text-gray-500 mt-3">
                Used by 75% of travelers to{' '}
                {tripSummary?.destination || 'popular destinations'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Results Card
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">
                  Trip Checklist Results
                </h3>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="p-1.5 rounded-lg hover:bg-white/80 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Checklist */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {checklist.map((item, idx) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  item.status === 'complete'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                {item.status === 'complete' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold text-sm ${
                      item.status === 'complete' ? 'text-green-900' : 'text-orange-900'
                    }`}>
                      {item.category}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'complete'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.status === 'complete' ? 'Complete' : 'Missing'}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {item.items.map((subItem, subIdx) => (
                      <li key={subIdx} className={`text-xs ${
                        item.status === 'complete' ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        • {subItem}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <p className="text-xs text-gray-600 text-center">
              This is a suggested checklist based on your trip details. Adjust as needed.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
