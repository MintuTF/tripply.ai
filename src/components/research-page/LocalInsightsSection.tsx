'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Train,
  Utensils,
  Shield,
  Wallet,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Insight {
  id: string;
  type: 'tip' | 'culture' | 'transport' | 'food' | 'safety' | 'budget';
  title: string;
  content: string;
}

const INSIGHT_CONFIGS: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  tip: { icon: Lightbulb, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  culture: { icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  transport: { icon: Train, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  food: { icon: Utensils, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  safety: { icon: Shield, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  budget: { icon: Wallet, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
};

// Sample insights by destination
const DESTINATION_INSIGHTS: Record<string, Insight[]> = {
  default: [
    { id: '1', type: 'tip', title: 'Pro Tip', content: 'Download offline maps before you go to save on data roaming charges.' },
    { id: '2', type: 'culture', title: 'Cultural Note', content: 'Learn a few basic phrases in the local language - locals appreciate the effort!' },
    { id: '3', type: 'transport', title: 'Getting Around', content: 'Public transportation is often the most efficient way to explore major cities.' },
    { id: '4', type: 'food', title: 'Food Tip', content: 'Eat where the locals eat - look for restaurants with mostly local customers.' },
    { id: '5', type: 'safety', title: 'Stay Safe', content: 'Keep copies of important documents in a separate place from the originals.' },
    { id: '6', type: 'budget', title: 'Save Money', content: 'Visit popular attractions early in the morning to avoid crowds and sometimes get lower prices.' },
  ],
  Tokyo: [
    { id: '1', type: 'tip', title: 'JR Pass', content: 'Get a JR Pass for unlimited travel on JR trains - it pays for itself in 2-3 long trips.' },
    { id: '2', type: 'culture', title: 'Temple Etiquette', content: 'Remove your shoes before entering temples and traditional spaces. Look for shoe racks.' },
    { id: '3', type: 'transport', title: 'Suica Card', content: 'Get a Suica/Pasmo card - works on all transit and many convenience stores.' },
    { id: '4', type: 'food', title: 'Conveyor Belt Sushi', content: 'Try kaitenzushi (conveyor belt sushi) for fresh, affordable sushi any time of day.' },
    { id: '5', type: 'safety', title: 'Lost & Found', content: 'Japan has excellent lost & found systems - check with station offices if you lose anything.' },
    { id: '6', type: 'budget', title: 'Lunch Specials', content: 'Many restaurants offer teishoku (set meals) at lunch for half the dinner price.' },
  ],
  Paris: [
    { id: '1', type: 'tip', title: 'Museum Pass', content: 'Get a Paris Museum Pass for skip-the-line access to 60+ attractions.' },
    { id: '2', type: 'culture', title: 'Greeting Custom', content: 'Always say "Bonjour" when entering any shop or restaurant - it\'s considered polite.' },
    { id: '3', type: 'transport', title: 'Metro Tips', content: 'Buy a carnet (10-pack) of metro tickets for significant savings over single rides.' },
    { id: '4', type: 'food', title: 'Bakery Hours', content: 'Visit boulangeries early morning for the freshest croissants and pain au chocolat.' },
    { id: '5', type: 'safety', title: 'Pickpockets', content: 'Be vigilant around tourist hotspots and on the metro - keep belongings secure.' },
    { id: '6', type: 'budget', title: 'Free Views', content: 'Skip the Eiffel Tower queue and enjoy free panoramic views from Sacré-Cœur instead.' },
  ],
  Bali: [
    { id: '1', type: 'tip', title: 'Temple Dress', content: 'Bring a sarong - required for temple visits and often provided for free.' },
    { id: '2', type: 'culture', title: 'Offering Respect', content: 'Step over canang sari (offerings) on the ground, never step on them.' },
    { id: '3', type: 'transport', title: 'Scooter Safety', content: 'If renting a scooter, always wear a helmet and drive defensively.' },
    { id: '4', type: 'food', title: 'Warung Dining', content: 'Eat at local warungs (family restaurants) for authentic, affordable Balinese food.' },
    { id: '5', type: 'safety', title: 'Water Safety', content: 'Stick to bottled water and avoid ice in drinks from street vendors.' },
    { id: '6', type: 'budget', title: 'Bargaining', content: 'Bargaining is expected at markets - start at 50% and negotiate from there.' },
  ],
};

interface InsightCardProps {
  insight: Insight;
  index: number;
}

function InsightCard({ insight, index }: InsightCardProps) {
  const config = INSIGHT_CONFIGS[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      className="flex-shrink-0 w-[280px] p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', config.bgColor)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>
      <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{insight.content}</p>
    </motion.div>
  );
}

interface LocalInsightsSectionProps {
  destination: string;
  className?: string;
}

export function LocalInsightsSection({
  destination,
  className,
}: LocalInsightsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const insights = DESTINATION_INSIGHTS[destination] || DESTINATION_INSIGHTS.default;

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollTo = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={cn('py-12 bg-accent/30', className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Local Insights
              </h2>
              <p className="text-muted-foreground">
                AI-powered tips for {destination}
              </p>
            </div>
          </div>
        </div>

        {/* Insights Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          {showLeftArrow && (
            <button
              onClick={() => scrollTo('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full p-3 border border-border/50 hover:bg-background transition-colors -ml-4"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {showRightArrow && (
            <button
              onClick={() => scrollTo('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full p-3 border border-border/50 hover:bg-background transition-colors -mr-4"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Gradient Fades */}
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-accent/30 to-transparent pointer-events-none z-[5]" />
          )}
          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-accent/30 to-transparent pointer-events-none z-[5]" />
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {insights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default LocalInsightsSection;
