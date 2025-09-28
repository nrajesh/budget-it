import React from 'react';
import ReportLayout from './ReportLayout';
import NetWorthStatement from '@/components/reports/NetWorthStatement';
import IncomeExpenseSummary from '@/components/reports/IncomeExpenseSummary';
import TrendsAndAnalytics from '@/components/reports/TrendsAndAnalytics';

const EssentialReports = () => {
  return (
    <ReportLayout
      title="Essential Reports"
      description="Your core financial summaries and trends based on historical data."
    >
      {({ historicalFilteredTransactions, accounts, budgets }) => (
        <>
          <NetWorthStatement transactions={historicalFilteredTransactions} accounts={accounts} />
          <IncomeExpenseSummary transactions={historicalFilteredTransactions} budgets={budgets} />
          <TrendsAndAnalytics transactions={historicalFilteredTransactions} budgets={budgets} />
        </>
      )}
    </ReportLayout>
  );
};

export default EssentialReports;