'use client';

import { motion } from 'framer-motion';
import { Globe, TreePalm, Mountain, Landmark, Sun, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Region = 'all' | 'asia' | 'europe' | 'americas' | 'africa' | 'oceania';

interface RegionOption {
  id: Region;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const REGIONS: RegionOption[] = [
  { id: 'all', label: 'All', icon: <Globe className="h-4 w-4" />, color: 'from-primary to-primary/80' },
  { id: 'asia', label: 'Asia', icon: <TreePalm className="h-4 w-4" />, color: 'from-rose-500 to-orange-500' },
  { id: 'europe', label: 'Europe', icon: <Landmark className="h-4 w-4" />, color: 'from-blue-500 to-indigo-500' },
  { id: 'americas', label: 'Americas', icon: <Mountain className="h-4 w-4" />, color: 'from-emerald-500 to-teal-500' },
  { id: 'africa', label: 'Africa', icon: <Sun className="h-4 w-4" />, color: 'from-amber-500 to-orange-600' },
  { id: 'oceania', label: 'Oceania', icon: <Waves className="h-4 w-4" />, color: 'from-cyan-500 to-blue-500' },
];

interface RegionFilterProps {
  selectedRegion: Region;
  onRegionChange: (region: Region) => void;
  className?: string;
}

export function RegionFilter({ selectedRegion, onRegionChange, className }: RegionFilterProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {REGIONS.map((region) => {
          const isSelected = selectedRegion === region.id;

          return (
            <motion.button
              key={region.id}
              onClick={() => onRegionChange(region.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm',
                'transition-all duration-200 whitespace-nowrap',
                'border border-transparent',
                isSelected
                  ? 'text-white shadow-lg'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              )}
            >
              {/* Background gradient for selected state */}
              {isSelected && (
                <motion.div
                  layoutId="regionBackground"
                  className={cn('absolute inset-0 rounded-xl bg-gradient-to-r', region.color)}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Icon and label */}
              <span className="relative z-10 flex items-center gap-2">
                {region.icon}
                {region.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
