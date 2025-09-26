import * as React from 'react';
import IncomeExpenseSummary from './reports/IncomeExpenseSummary';
import NetWorthStatement from './reports/NetWorthStatement';

const ReportsPage = () => {
  return (
    <div className="flex-1 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Essential Reports</h2>
        <p className="text-muted-foreground">
          A quick overview of your key financial metrics.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <IncomeExpenseSummary />
        <NetWorthStatement />
      </div>
    </div>
  );
};

export default ReportsPage;