"use client";

import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReportLayout, { ReportChildrenProps } from "./ReportLayout"; // Import ReportChildrenProps
import { TransactionTable } from "../../components/transactions/TransactionTable"; // Corrected relative path
import { useMemo } from "react";

export default function AdvancedReports() {
  const description = (
    <>
      Detailed financial analysis including combined historical and future projections, and budget tracking.
    </>
  );

  return (
    <ReportLayout
      title="Advanced Reports"
      description={description}
    >
      {({ historicalFilteredTransactions, combinedFilteredTransactions, futureFilteredTransactions, allAccounts, budgets }: ReportChildrenProps) => (
        <>
          <BalanceOverTimeChart transactions={combinedFilteredTransactions} />
          <Card>
            <CardHeader>
              <CardTitle>Combined Transactions (Historical & Future)</CardTitle>
              <CardDescription>All transactions and scheduled transactions within the selected date range.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={combinedFilteredTransactions}
                onEdit={() => {}}
                onDelete={() => {}}
                isLoading={false}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Future Scheduled Transactions</CardTitle>
              <CardDescription>Upcoming scheduled transactions based on the selected date range.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* You might need a separate table component for ScheduledTransaction if its structure differs significantly */}
              <TransactionTable
                transactions={futureFilteredTransactions.map(st => ({
                  ...st,
                  vendor: st.vendor, // Ensure vendor is present for type compatibility
                  is_scheduled_origin: true,
                  recurrence_id: st.id,
                  recurrence_frequency: st.frequency,
                  recurrence_end_date: st.recurrence_end_date,
                  user_id: st.user_id,
                  created_at: st.created_at,
                  currency: 'USD' // Default currency, adjust if needed
                }))}
                onEdit={() => {}}
                onDelete={() => {}}
                isLoading={false}
              />
            </CardContent>
          </Card>
          {/* Add more advanced report components here, e.g., Budget vs Actual */}
        </>
      )}
    </ReportLayout>
  );
}