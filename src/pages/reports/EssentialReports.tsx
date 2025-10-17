"use client";

import { BalanceOverTimeChart } from "@/components/BalanceOverTimeChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReportLayout, { ReportChildrenProps } from "./ReportLayout"; // Import ReportChildrenProps
import { TransactionTable } from "../../components/transactions/TransactionTable"; // Corrected relative path
import { useMemo } from "react";

export default function EssentialReports() {
  return (
    <ReportLayout
      title="Essential Reports"
      description="Your core financial summaries and trends based on historical data."
    >
      {({ historicalFilteredTransactions, allAccounts, budgets }: ReportChildrenProps) => (
        <>
          <BalanceOverTimeChart transactions={historicalFilteredTransactions} />
          <Card>
            <CardHeader>
              <CardTitle>Historical Transactions</CardTitle>
              <CardDescription>All transactions up to the selected date range.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={historicalFilteredTransactions}
                onEdit={() => {}} // Reports are read-only, no edit/delete actions
                onDelete={() => {}}
                isLoading={false} // Assuming data is loaded by ReportLayout
              />
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
}