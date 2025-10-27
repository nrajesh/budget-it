"use client";

import React from 'react';
import ReportLayout from './ReportLayout';
import IncomeExpenseSummary from './IncomeExpenseSummary';
import NetWorthStatement from './NetWorthStatement';

const EssentialReports = () => {
  return (
    <ReportLayout
      title="Essential Reports"
      description="Key insights into your financial health, including income, expenses, and net worth."
    >
      {({ historicalFilteredTransactions, accounts }) => (
        <div className="grid gap-6">
          <IncomeExpenseSummary transactions={historicalFilteredTransactions} />
          <NetWorthStatement transactions={historicalFilteredTransactions} accounts={accounts} />
        </div>
      )}
    </ReportLayout>
  );
};

export default EssentialReports;