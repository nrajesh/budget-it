import { Transaction, ScheduledTransaction } from "@/types/dataProvider";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";

export interface ProjectedTransaction extends Transaction {
  is_projected: boolean;
}

/**
 * Projects scheduled transactions into a list of virtual future transactions
 * within a specified date range.
 *
 * @param scheduledTransactions List of active scheduled transactions
 * @param startDate Start of the projection window
 * @param endDate End of the projection window
 * @returns Array of virtual Transaction objects with is_projected: true
 */
export function projectScheduledTransactions(
  scheduledTransactions: ScheduledTransaction[],
  startDate: Date,
  endDate: Date,
): ProjectedTransaction[] {
  const projected: ProjectedTransaction[] = [];
  const windowStart = startOfDay(startDate);
  const windowEnd = endOfDay(endDate);

  scheduledTransactions.forEach((st) => {
    // Parse next scheduled date
    let currentDate = parseISO(st.date);

    // Safety: If current date is invalid
    if (isNaN(currentDate.getTime())) return;

    const recurrenceEnd = st.end_date ? parseISO(st.end_date) : null;

    // Loop limit safety (e.g. 500 instances max per transaction to prevent infinite loops)
    let iterations = 0;
    const MAX_ITERATIONS = 365 * 5; // 5 years of daily

    while (
      isBefore(currentDate, windowEnd) ||
      currentDate.getTime() === windowEnd.getTime()
    ) {
      if (iterations++ > MAX_ITERATIONS) break;

      // Check if passed recurrence end date
      if (recurrenceEnd && isAfter(currentDate, recurrenceEnd)) break;

      // If within window, add to list
      if (
        isAfter(currentDate, windowStart) ||
        currentDate.getTime() === windowStart.getTime()
      ) {
        projected.push({
          id: `proj_${st.id}_${currentDate.toISOString()}`, // Virtual ID
          user_id: st.user_id,
          date: currentDate.toISOString(),
          amount: st.amount,
          currency: st.currency,
          account: st.account,
          vendor: st.vendor,
          category: st.category,
          sub_category: st.sub_category || null,
          remarks: st.remarks || "Projected",
          is_scheduled_origin: true,
          is_projected: true,
          recurrence_id: st.id,
          transfer_id: st.transfer_id || null,
          created_at: new Date().toISOString(),
        });
      }

      // Advance Date
      let intervalValue = 1;
      let intervalUnit = "m";

      const namedFrequencies: Record<string, { unit: string; value: number }> = {
        Daily: { unit: "d", value: 1 },
        Weekly: { unit: "w", value: 1 },
        Fortnightly: { unit: "w", value: 2 },
        "Bi-Weekly": { unit: "w", value: 2 },
        Monthly: { unit: "m", value: 1 },
        Quarterly: { unit: "m", value: 3 },
        Yearly: { unit: "y", value: 1 },
      };

      if (namedFrequencies[st.frequency]) {
        const mapped = namedFrequencies[st.frequency];
        intervalValue = mapped.value;
        intervalUnit = mapped.unit;
      } else {
        // Parse "1d", "2w" etc.
        const match = st.frequency.match(/^(\d+)([dwmy])$/);
        if (match) {
          intervalValue = parseInt(match[1], 10);
          intervalUnit = match[2];
        }
      }

      switch (intervalUnit) {
        case "d":
          currentDate = addDays(currentDate, intervalValue);
          break;
        case "w":
          currentDate = addWeeks(currentDate, intervalValue);
          break;
        case "m":
          currentDate = addMonths(currentDate, intervalValue);
          break;
        case "y":
          currentDate = addYears(currentDate, intervalValue);
          break;
        default:
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }
  });

  return projected.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
