import { ScheduledTransaction, Transaction } from "@/types/dataProvider";
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

/**
 * Projects scheduled transactions into a list of virtual future transactions
 * within a specified date range.
 *
 * @param scheduledTransactions List of active scheduled transactions
 * @param startDate Start of the projection window
 * @param endDate End of the projection window
 * @returns Array of virtual Transaction objects with is_projected: true
 */
const FREQUENCY_MAP: Record<string, { value: number; unit: string }> = {
  Daily: { value: 1, unit: "d" },
  Weekly: { value: 1, unit: "w" },
  "Bi-Weekly": { value: 2, unit: "w" },
  Monthly: { value: 1, unit: "m" },
  Quarterly: { value: 3, unit: "m" },
  Yearly: { value: 1, unit: "y" },
};

export function projectScheduledTransactions(
  scheduledTransactions: ScheduledTransaction[],
  startDate: Date,
  endDate: Date,
): Transaction[] {
  // We return Transaction[] that matches Transaction shape but with extra flags if needed
  const projected: Transaction[] = [];
  const windowStart = startOfDay(startDate);
  const windowEnd = endOfDay(endDate);

  scheduledTransactions.forEach((st) => {
    // Parse next scheduled date
    let currentDate = parseISO(st.date);

    // Safety: If current date is invalid
    if (isNaN(currentDate.getTime())) return;

    // If the scheduled date is BEFORE the window start, we need to fast-forward it
    // to the first occurrence within the window.
    // HOWEVER, for simple reports like "Net Worth", usually we just want everything FROM today.
    // Ideally, the 'st.date' IS the next occurrence. So if it's in the past, it's overdue.
    // If it's in the future, it's upcoming.

    // We iterate while currentDate <= windowEnd
    // But we also need to respect st.recurrence_end_date if exists.
    const recurrenceEnd = st.end_date ? parseISO(st.end_date) : null;

    // Loop limit safety (e.g. 500 instances max per transaction to prevent infinite loops)
    let iterations = 0;
    const MAX_ITERATIONS = 365 * 5; // 5 years of daily

    // Pre-calculate frequency interval to avoid parsing in the loop
    let intervalValue = 1;
    let intervalUnit = "m";

    const mapped = FREQUENCY_MAP[st.frequency];

    if (mapped) {
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
          sub_category: st.sub_category,
          remarks: st.remarks || "Projected",
          is_scheduled_origin: true,
          is_projected: true, // Flag for UI/Logic to distinguish
          recurrence_id: st.id,
          transfer_id: st.transfer_id,
          created_at: currentDate.toISOString(),
        });
      }

      // Advance Date
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
          currentDate = addMonths(currentDate, 1); // Fallback
          break;
      }
    }
  });

  return projected.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
