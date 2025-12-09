'use client';

interface PriceDisplayProps {
  amount: number;
  currency?: string;
  period?: 'night' | 'person' | 'total';
  checkInDate?: string;
  checkOutDate?: string;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    JPY: '\u00A5',
    AUD: 'A$',
    CAD: 'C$',
  };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PriceDisplay({
  amount,
  currency = 'USD',
  period = 'night',
  checkInDate,
  checkOutDate,
}: PriceDisplayProps) {
  const periodLabels: Record<string, string> = {
    night: 'per night',
    person: 'per person',
    total: 'total',
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-foreground">
          {formatCurrency(amount, currency)}
        </span>
        <span className="text-xs text-muted-foreground">
          {periodLabels[period]}
        </span>
      </div>
      {checkInDate && checkOutDate && (
        <span className="text-xs text-muted-foreground mt-0.5">
          {formatDate(checkInDate)} - {formatDate(checkOutDate)}
        </span>
      )}
    </div>
  );
}
