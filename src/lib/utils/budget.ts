// Budget tracking utilities

export interface BudgetItem {
  id: string;
  category: 'accommodation' | 'food' | 'activities' | 'transportation' | 'shopping' | 'other';
  name: string;
  amount: number;
  currency: string;
  date?: string;
  day?: number;
  notes?: string;
}

export interface BudgetSummary {
  total: number;
  byCategory: Record<string, number>;
  remaining: number;
  percentSpent: number;
}

export interface BudgetAlert {
  type: 'warning' | 'danger';
  message: string;
}

// Budget categories with colors and icons
export const BUDGET_CATEGORIES = {
  accommodation: {
    label: 'Accommodation',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  food: {
    label: 'Food & Drinks',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  activities: {
    label: 'Activities',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
  transportation: {
    label: 'Transportation',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    textColor: 'text-green-600 dark:text-green-400',
  },
  shopping: {
    label: 'Shopping',
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    textColor: 'text-pink-600 dark:text-pink-400',
  },
  other: {
    label: 'Other',
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
};

/**
 * Calculate budget summary from list of budget items
 */
export function calculateBudgetSummary(
  items: BudgetItem[],
  totalBudget?: number
): BudgetSummary {
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const byCategory = items.reduce((acc, item) => {
    const category = item.category;
    acc[category] = (acc[category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const remaining = totalBudget ? totalBudget - total : 0;
  const percentSpent = totalBudget ? (total / totalBudget) * 100 : 0;

  return {
    total,
    byCategory,
    remaining,
    percentSpent,
  };
}

/**
 * Get budget alerts based on spending
 */
export function getBudgetAlerts(
  summary: BudgetSummary,
  totalBudget?: number
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  if (!totalBudget) return alerts;

  if (summary.percentSpent >= 100) {
    alerts.push({
      type: 'danger',
      message: 'Budget exceeded! You have spent more than your planned budget.',
    });
  } else if (summary.percentSpent >= 90) {
    alerts.push({
      type: 'danger',
      message: 'Almost over budget! Only 10% of your budget remains.',
    });
  } else if (summary.percentSpent >= 75) {
    alerts.push({
      type: 'warning',
      message: 'You have used 75% of your budget. Monitor your spending carefully.',
    });
  }

  return alerts;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Get category from card type
 */
export function getCategoryFromCardType(
  cardType: string
): BudgetItem['category'] {
  const typeMap: Record<string, BudgetItem['category']> = {
    hotel: 'accommodation',
    restaurant: 'food',
    activity: 'activities',
    attraction: 'activities',
    flight: 'transportation',
    transport: 'transportation',
  };

  return typeMap[cardType.toLowerCase()] || 'other';
}

/**
 * Export budget data to CSV
 */
export function exportBudgetToCSV(items: BudgetItem[], tripTitle: string): void {
  const headers = ['Date', 'Category', 'Name', 'Amount', 'Currency', 'Notes'];
  const rows = items.map((item) => [
    item.date || '',
    BUDGET_CATEGORIES[item.category].label,
    item.name,
    item.amount.toString(),
    item.currency,
    item.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${tripTitle.replace(/\s+/g, '_')}_Budget.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
