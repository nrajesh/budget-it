import { useState, useMemo, useEffect } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";
import { Budget } from "@/types/dataProvider";
import { CalendarGrid } from "@/components/dashboard/calendar/CalendarGrid";
import { DailyTransactions } from "@/components/dashboard/calendar/DailyTransactions";
import { generateScheduledOccurrences } from "@/utils/calendarUtils";
import { startOfMonth, endOfMonth, isSameDay, format } from "date-fns";

export default function CalendarView() {
    const { transactions, scheduledTransactions } = useTransactions();
    const { activeLedger } = useLedger();
    const dataProvider = useDataProvider();

    // Use a fixed date for initial render to avoid hydration mismatch if date changes, 
    // but here we are client side. default is fine.
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [budgets, setBudgets] = useState<Budget[]>([]);

    // Fetch budgets (similar to Budgets page)
    useEffect(() => {
        const fetchBudgets = async () => {
            if (activeLedger?.id) {
                try {
                    const data = await dataProvider.getBudgetsWithSpending(activeLedger.id);
                    setBudgets(data || []);
                } catch (error) {
                    console.error("Failed to fetch budgets", error);
                }
            }
        };
        fetchBudgets();
    }, [activeLedger?.id, dataProvider]);

    // Generate scheduled occurrences for the current month view
    const scheduledOccurrences = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        // Generate for slightly wider range to cover grid padding if needed, 
        // but grid logic generates its own days. 
        // Let's generate for current month + padding.
        // Actually, just passing current month start/end is safer for "view".
        return generateScheduledOccurrences(scheduledTransactions, start, end);
    }, [scheduledTransactions, currentDate]);

    // Aggregate transaction counts and net amounts per day
    const dayData = useMemo(() => {
        const data: Record<string, { count: number; netAmount: number; hasScheduled: boolean }> = {};

        // Process actual transactions
        transactions.forEach((t) => {
            if (t.category === "Transfer") return; // Exclude transfers from count and net amount? User said "transfers don't count".

            const dateKey = t.date.split("T")[0];
            if (!data[dateKey]) data[dateKey] = { count: 0, netAmount: 0, hasScheduled: false };

            data[dateKey].count += 1;
            // Assuming amount is signed (negative for expense, positive for income) based on previous analysis
            data[dateKey].netAmount += t.amount;
        });

        // Process scheduled occurrences
        scheduledOccurrences.forEach((occo) => {
            // Use local date format to match grid keys
            const dateKey = format(occo.date, "yyyy-MM-dd");
            if (!data[dateKey]) data[dateKey] = { count: 0, netAmount: 0, hasScheduled: false };

            data[dateKey].hasScheduled = true;

            // Add to net amount if not a transfer
            if (occo.original.category !== "Transfer") {
                data[dateKey].netAmount += occo.original.amount;
            }
        });

        return data;
    }, [transactions, scheduledOccurrences]);

    // Combine transactions for the Daily View
    const combinedDailyTransactions = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = selectedDate.toISOString().split("T")[0];

        const actual = transactions.filter(t => t.date.startsWith(dateKey));

        // Find scheduled for this date
        const scheduled = scheduledOccurrences.filter(occo => isSameDay(occo.date, selectedDate)).map(occo => ({
            ...occo.original,
            id: `scheduled-${occo.original.id}-${dateKey}`, // Temp ID
            date: occo.date.toISOString(),
            is_projected: true, // Mark as projected
        }));

        // We need to match the Transaction interface for DailyTransactions component?
        // ScheduledTransaction key differences: 'account' is string name, 'vendor' is string name.
        // Transaction: 'account' is string (ID or name?), 'vendor' is string name.
        // In dataProvider.ts, Transaction.account is string.
        // Let's coerce.
        const mappedScheduled = scheduled.map(s => ({
            id: s.id,
            user_id: s.user_id,
            date: s.date,
            amount: s.amount,
            currency: s.currency,
            account: s.account,
            vendor: s.vendor,
            category: s.category,
            sub_category: s.sub_category,
            remarks: s.remarks,
            created_at: s.created_at,
            is_projected: true
        } as unknown as import("@/types/dataProvider").Transaction));

        // Only show scheduled if they are in the future relative to "now"? 
        // Or if they haven't been processed?
        // Usually, if an actual transaction exists that matches the schedule, we shouldn't show the schedule.
        // But for simplicity, let's show them if they are projected. 
        // User asked "Why are scheduled transactions in future not displayed".
        // If selected date is today or past, maybe we shouldn't show "Scheduled" if it's already done.
        // But we don't know if it's done. 
        // Let's show them but marked as "Scheduled".

        // Filter out scheduled if we are strict about "future".
        // But user might want to see what was scheduled today even if not entered yet.
        return [...actual, ...mappedScheduled];
    }, [selectedDate, transactions, scheduledOccurrences]);

    return (
        <div className="h-full flex flex-col space-y-4 p-4 md:p-8 pt-6 overflow-hidden">
            <div className="flex items-center justify-between space-y-2 shrink-0">
                <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                <div className="h-full min-h-0 overflow-hidden">
                    <CalendarGrid
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        dayData={dayData}
                    />
                </div>
                <div className="h-full min-h-0 overflow-hidden flex flex-col">
                    <DailyTransactions
                        date={selectedDate}
                        transactions={combinedDailyTransactions}
                        budgets={budgets}
                    />
                </div>
            </div>
        </div>
    );
}
