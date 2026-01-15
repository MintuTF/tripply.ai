'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Hotel,
  UtensilsCrossed,
  Compass,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BudgetConstraints {
  totalBudget?: number;
  dailyBudget?: number;
  maxHotelPerNight?: number;
  maxMealCost?: number;
  maxActivityCost?: number;
}

interface BudgetConstraintsSidebarProps {
  budgetConstraints: BudgetConstraints;
  onUpdate: (constraints: BudgetConstraints) => void;
  className?: string;
}

export function BudgetConstraintsSidebar({
  budgetConstraints,
  onUpdate,
  className,
}: BudgetConstraintsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUpdate = (field: keyof BudgetConstraints, value: number | undefined) => {
    onUpdate({
      ...budgetConstraints,
      [field]: value,
    });
  };

  const hasConstraints = Object.values(budgetConstraints).some((v) => v !== undefined && v > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border-2 border-border bg-gradient-to-br from-background to-muted/20 overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="font-semibold text-foreground">Budget Constraints</span>
          {hasConstraints && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-medium">
              Active
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="p-4 space-y-4">
          {/* Info Banner */}
          <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              AI will respect these limits when suggesting places
            </p>
          </div>

          {/* Overall Budget */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Total Trip Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                value={budgetConstraints.totalBudget || ''}
                onChange={(e) =>
                  handleUpdate('totalBudget', e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="e.g., 2000"
                className="w-full pl-8 pr-3 py-2 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Daily Budget */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Daily Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                value={budgetConstraints.dailyBudget || ''}
                onChange={(e) =>
                  handleUpdate('dailyBudget', e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="e.g., 200"
                className="w-full pl-8 pr-3 py-2 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Category Limits */}
          <div className="pt-2 border-t border-border space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Category Limits</h4>

            {/* Hotel */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                Max Hotel/Night
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={budgetConstraints.maxHotelPerNight || ''}
                  onChange={(e) =>
                    handleUpdate(
                      'maxHotelPerNight',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 150"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Meal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Max Meal Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={budgetConstraints.maxMealCost || ''}
                  onChange={(e) =>
                    handleUpdate('maxMealCost', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="e.g., 50"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Compass className="w-4 h-4" />
                Max Activity Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={budgetConstraints.maxActivityCost || ''}
                  onChange={(e) =>
                    handleUpdate(
                      'maxActivityCost',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 75"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Clear Button */}
          {hasConstraints && (
            <button
              onClick={() =>
                onUpdate({
                  totalBudget: undefined,
                  dailyBudget: undefined,
                  maxHotelPerNight: undefined,
                  maxMealCost: undefined,
                  maxActivityCost: undefined,
                })
              }
              className="w-full px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
            >
              Clear All Constraints
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
