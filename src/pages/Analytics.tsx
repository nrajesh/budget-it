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
    <div className="page-container space-y-2">
      <div className="tour-analytics-chart">
        <AnalyticsChartView transactions={currentTransactions} />
      </div>
    </div>
  );
};

export default Analytics;
