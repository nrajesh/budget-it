"use client";

import { Transaction } from '@/types/finance';
import { addMonths, addWeeks, addYears, isBefore } from 'date-fns';

export const generateFutureTransactions = (
  scheduledTransactions: any[],
  accountCurrencyMap: Map<string, string>
): Transaction[] => {
  const futureTransactions: Transaction[] = [];
  const now = new Date();
  const futureCutoff = addYears(now, 1); // Generate up to 1 year in the future

  scheduledTransactions.forEach(st => {
    let nextDate = new Date(st.date);
    
    while (isBefore(nextDate, now)) {
      if (st.frequency === 'monthly') nextDate = addMonths(nextDate, 1);
      else if (st.frequency === 'weekly') nextDate = addWeeks(nextDate, 1);
      else if (st.frequency === 'yearly') nextDate = addYears(nextDate, 1);
      else break; // Should not happen for recurring transactions
    }

    while (isBefore(nextDate, futureCutoff) && (!st.recurrence_end_date || isBefore(nextDate, new Date(st.recurrence_end_date)))) {
      futureTransactions.push({
        id: `${st.id}-${nextDate.toISOString()}`,
        date: nextDate.toISOString(),
        account: st.account,
        vendor: st.vendor,
        category: st.category,
        amount: st.amount,
        currency: accountCurrencyMap.get(st.account) || 'USD',
        remarks: `(Scheduled) ${st.remarks || ''}`,
        is_scheduled_origin: true,
        transfer_id: null,
        user_id: st.user_id,
        recurrence_id: st.id,
        recurrence_frequency: st.frequency,
        recurrence_end_date: st.recurrence_end_date,
        created_at: new Date().toISOString(),
      });

      if (st.frequency === 'monthly') nextDate = addMonths(nextDate, 1);
      else if (st.frequency === 'weekly') nextDate = addWeeks(nextDate, 1);
      else if (st.frequency === 'yearly') nextDate = addYears(nextDate, 1);
      else break;
    }
  });

  return futureTransactions;
};