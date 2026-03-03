import * as React from "react";
import { AnalyticsChartView } from "@/components/charts/AnalyticsChartView";
import { useTransactions } from "@/contexts/TransactionsContext";

const Analytics = () => {
  const { transactions } = useTransactions();

  // Filter out future transactions for the analytics view
  const currentTransactions = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate <= today;
    });
  }, [transactions]);

  return (
    <div className="space-y-2 p-3 sm:p-6 min-h-[calc(100vh-100px)] transition-all duration-500 bg-background">
      <AnalyticsChartView transactions={currentTransactions} />
    </div>
  );
};

export default Analytics;
