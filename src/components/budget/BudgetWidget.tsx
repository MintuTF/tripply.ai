'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Trip } from '@/types';
import {
  BudgetItem,
  calculateBudgetSummary,
  getBudgetAlerts,
  formatCurrency,
  getCategoryFromCardType,
  exportBudgetToCSV,
} from '@/lib/utils/budget';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  Plus,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetWidgetProps {
  trip: Trip;
  cards: Card[];
  totalBudget?: number;
  currency?: string;
  onUpdateBudget?: (budget: number) => void;
}

export function BudgetWidget({
  trip,
  cards,
  totalBudget,
  currency = 'USD',
  onUpdateBudget,
}: BudgetWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(totalBudget?.toString() || '');

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
        date: card.day ? trip.dates.start : undefined,
        day: card.day,
        notes: payload.notes,
      };
    });

  const summary = calculateBudgetSummary(budgetItems, totalBudget);
  const alerts = getBudgetAlerts(summary, totalBudget);

  const handleSaveBudget = () => {
    const newBudget = parseFloat(budgetInput);
    if (!isNaN(newBudget) && newBudget > 0) {
      onUpdateBudget?.(newBudget);
    }
    setIsEditing(false);
  };

  const handleExportCSV = () => {
    exportBudgetToCSV(budgetItems, trip.title);
  };

  return (
    <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Budget Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="rounded-lg bg-background px-3 py-1.5 text-xs font-semibold border border-border hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Budget */}
          <div className="rounded-xl border-2 border-border bg-background p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setBudgetInput(totalBudget?.toString() || '');
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {totalBudget ? 'Edit' : 'Set'}
                </button>
              ) : null}
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="Enter budget"
                  className="flex-1 rounded-lg border-2 border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={handleSaveBudget}
                  className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {totalBudget ? formatCurrency(totalBudget, currency) : 'Not set'}
              </p>
            )}
          </div>

          {/* Total Spent */}
          <div className="rounded-xl border-2 border-border bg-background p-4">
            <p className="text-sm text-muted-foreground mb-2">Total Spent</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.total, currency)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {budgetItems.length} {budgetItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          {/* Remaining */}
          <div
            className={cn(
              'rounded-xl border-2 p-4',
              summary.percentSpent >= 100
                ? 'border-red-500/30 bg-red-500/5'
                : summary.percentSpent >= 75
                ? 'border-orange-500/30 bg-orange-500/5'
                : 'border-border bg-background'
            )}
          >
            <p className="text-sm text-muted-foreground mb-2">Remaining</p>
            {totalBudget ? (
              <>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    summary.remaining < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-foreground'
                  )}
                >
                  {formatCurrency(summary.remaining, currency)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {summary.percentSpent.toFixed(1)}% of budget used
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Set a budget to track</p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {totalBudget && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget Progress</span>
              <span className="font-semibold text-foreground">
                {summary.percentSpent.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(summary.percentSpent, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  summary.percentSpent >= 100
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : summary.percentSpent >= 90
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                    : summary.percentSpent >= 75
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                )}
              />
            </div>
          </div>
        )}

        {/* Budget Alerts */}
        {alerts.map((alert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex items-start gap-2 rounded-lg border p-3',
              alert.type === 'danger'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-orange-500/10 border-orange-500/20'
            )}
          >
            <AlertTriangle
              className={cn(
                'h-4 w-4 flex-shrink-0 mt-0.5',
                alert.type === 'danger'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-orange-500 dark:text-orange-400'
              )}
            />
            <p
              className={cn(
                'text-sm',
                alert.type === 'danger'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-orange-600 dark:text-orange-400'
              )}
            >
              {alert.message}
            </p>
          </motion.div>
        ))}

        {/* Empty State */}
        {budgetItems.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm font-semibold text-foreground">No expenses yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add costs to your cards to track spending
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
