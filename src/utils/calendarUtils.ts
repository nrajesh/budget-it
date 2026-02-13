import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import { ScheduledTransaction } from "@/types/dataProvider";

export interface ScheduledOccurrence {
  original: ScheduledTransaction;
  date: Date;
  amount: number;
}

export const generateScheduledOccurrences = (
  scheduledTransactions: ScheduledTransaction[],
  startDate: Date,
  endDate: Date,
): ScheduledOccurrence[] => {
  const occurrences: ScheduledOccurrence[] = [];
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  scheduledTransactions.forEach((t) => {
    // Parse next scheduled date
    let current = startOfDay(parseISO(t.date));

    // If start date is in past relative to range start, we might need to project forward?
    // Actually, t.date is the "Next scheduled date". So it should be >= today usually.
    // If we are viewing a future month, we need to project from t.date.
    // If we are viewing a past month, we can't easily reconstruction past occurrences from "next date" unless we reverse calculate or use "last_processed".
    // "Scheduled transactions in future not displayed" -> User wants to see FUTURE.
    // So we invoke this for current/future months.

    // Safety break
    let limit = 0;
    while (isBefore(current, end) && limit < 1000) {
      if (!isBefore(current, start)) {
        occurrences.push({
          original: t,
          date: current,
          amount: t.amount,
        });
      }

      // Advance date
      switch (t.frequency) {
        case "Daily":
          current = addDays(current, 1);
          break;
        case "Weekly":
          current = addWeeks(current, 1);
          break;
        case "Monthly":
          current = addMonths(current, 1);
          break;
        case "Yearly":
          current = addYears(current, 1);
          break;
        default:
          // Handle "2w", "1y" etc?
          // For now assume standard simple frequencies or single occurrence
          if (t.frequency === "One-time") {
            limit = 1001; // Exit
          } else {
            // Try to parse number + unit
            const match = t.frequency.match(/^(\d+)([dwmy])$/);
            if (match) {
              const val = parseInt(match[1]);
              const unit = match[2];
              if (unit === "d") current = addDays(current, val);
              else if (unit === "w") current = addWeeks(current, val);
              else if (unit === "m") current = addMonths(current, val);
              else if (unit === "y") current = addYears(current, val);
              else limit = 1001;
            } else {
              limit = 1001; // Unknown frequency
            }
          }
          break;
      }
      limit++;
    }
  });

  return occurrences;
};
