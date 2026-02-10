import React from "react";
import { Link } from "react-router-dom";
import ReportLayout from "./ReportLayout";
import SankeyChart from "@/components/reports/SankeyChart";
import AlertsAndInsights from "@/components/reports/AlertsAndInsights";
import TrendForecastingChart from "@/components/reports/TrendForecastingChart";

const AdvancedReports = () => {
  const [futureMonths, setFutureMonths] = React.useState(2);

  React.useEffect(() => {
    const savedMonths = localStorage.getItem("futureMonths");
    if (savedMonths) {
      setFutureMonths(parseInt(savedMonths, 10));
    }
  }, []);

  const description = (
    <p>
      Future projections for the next {futureMonths} months. You can change this
      in{" "}
      <Link to="/settings" className="text-primary underline">
        Settings
      </Link>
      .
    </p>
  );

  return (
    <ReportLayout title="Advanced Reports" description={description}>
      {({
        historicalFilteredTransactions,
        combinedFilteredTransactions,
        futureFilteredTransactions,
        accounts,
        budgets,
      }) => (
        <>
          <AlertsAndInsights
            historicalTransactions={historicalFilteredTransactions}
            futureTransactions={futureFilteredTransactions}
            accounts={accounts}
            budgets={budgets}
          />
          <TrendForecastingChart transactions={combinedFilteredTransactions} />
          <SankeyChart
            transactions={historicalFilteredTransactions}
            accounts={accounts}
          />
        </>
      )}
    </ReportLayout>
  );
};

export default AdvancedReports;
