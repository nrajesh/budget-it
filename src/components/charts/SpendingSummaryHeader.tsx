"use client";

import { useCurrency } from "@/contexts/CurrencyContext";

interface SpendingSummaryHeaderProps {
  totalSpent: number;
  previousTotalSpent: number;
  spentDelta: number;
  periodLabel: string;
  hasPreviousPeriod: boolean;
}

export function SpendingSummaryHeader({
  totalSpent,
  previousTotalSpent,
  spentDelta,
  periodLabel,
  hasPreviousPeriod,
}: SpendingSummaryHeaderProps) {
  const { formatCurrency } = useCurrency();

  const isLower = spentDelta < 0;
  const isHigher = spentDelta > 0;
  const absDelta = Math.abs(spentDelta);

  return (
    <div className="px-1 mb-4">
      <p className="text-sm font-medium text-muted-foreground tracking-wide">
        Spent
      </p>
      <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-0.5">
        {formatCurrency(totalSpent)}
      </p>
      {hasPreviousPeriod && previousTotalSpent > 0 && (
        <p className="mt-1 text-sm font-medium flex items-center gap-1.5">
          {isLower && (
            <>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ▼ {formatCurrency(absDelta)}
              </span>
            </>
          )}
          {isHigher && (
            <>
              <span className="text-red-600 dark:text-red-400 font-semibold">
                ▲ {formatCurrency(absDelta)}
              </span>
            </>
          )}
          {!isLower && !isHigher && (
            <span className="text-muted-foreground font-semibold">
              No change
            </span>
          )}
          <span className="text-muted-foreground">· {periodLabel}</span>
        </p>
      )}
      {(!hasPreviousPeriod || previousTotalSpent === 0) && (
        <p className="mt-1 text-sm text-muted-foreground">{periodLabel}</p>
      )}
    </div>
  );
}
