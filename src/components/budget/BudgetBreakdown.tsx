'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/types';
import {
  BudgetItem,
  BUDGET_CATEGORIES,
  calculateBudgetSummary,
  formatCurrency,
  getCategoryFromCardType,
} from '@/lib/utils/budget';
import { PieChart, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetBreakdownProps {
  cards: Card[];
  currency?: string;
}

export function BudgetBreakdown({ cards, currency = 'USD' }: BudgetBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Extract budget items from cards
  const budgetItems: BudgetItem[] = cards
    .filter((card) => {
      const payload = card.payload_json as any;
      return payload.cost && payload.cost > 0;
    })
    .map((card) => {
      const payload = card.payload_json as any;
      return {
        id: card.id,
        category: getCategoryFromCardType(card.type),
        name: payload.name,
        amount: payload.cost || 0,
        currency: currency,
        day: card.day,
      };
    });

  const summary = calculateBudgetSummary(budgetItems);

  // Group items by category
  const itemsByCategory = budgetItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Get sorted categories by spending
  const sortedCategories = Object.entries(summary.byCategory).sort(
    ([, a], [, b]) => b - a
  );

  if (budgetItems.length === 0) {
    return (
      <div className="rounded-xl border-2 border-border bg-card p-8 text-center">
        <PieChart className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm font-semibold text-foreground">No spending breakdown yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add costs to your cards to see category breakdown
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Spending by Category</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {sortedCategories.map(([category, amount]) => {
          const categoryInfo = BUDGET_CATEGORIES[category as keyof typeof BUDGET_CATEGORIES];
          const percentage = (amount / summary.total) * 100;
          const isExpanded = expandedCategories.has(category);
          const categoryItems = itemsByCategory[category] || [];

          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full rounded-xl border-2 border-border bg-background p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        `gradient-${category}`,
                        categoryInfo.bgColor
                      )}
                    >
                      <span className="text-lg font-bold">{categoryItems.length}</span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-foreground">
                        {categoryInfo.label}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(amount, currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', `bg-gradient-to-r ${categoryInfo.color}`)}
                  />
                </div>
              </button>

              {/* Expanded Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pl-4">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded-lg border-2 p-3 flex items-center justify-between',
                            categoryInfo.borderColor,
                            categoryInfo.bgColor
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm line-clamp-1">
                              {item.name}
                            </p>
                            {item.day && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Day {item.day}
                              </p>
                            )}
                          </div>
                          <p className={cn('text-sm font-bold', categoryInfo.textColor)}>
                            {formatCurrency(item.amount, currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Summary */}
        <div className="rounded-xl border-2 border-border bg-muted/30 p-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">Total Spending</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(summary.total, currency)}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <p className="text-muted-foreground">Across {budgetItems.length} items</p>
            <p className="text-muted-foreground">
              {sortedCategories.length} {sortedCategories.length === 1 ? 'category' : 'categories'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
