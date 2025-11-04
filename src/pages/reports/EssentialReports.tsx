import React from 'react';
import ReportDataProvider from './ReportDataProvider';
import { NetWorthChart } from '@/components/charts/NetWorthChart';
import { SpendingByCategoryChart } from '@/components/charts/SpendingByCategoryChart';
import { IncomeVsExpenseChart } from '@/components/charts/IncomeVsExpenseChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EssentialReports = () => {
  return (
    <ReportDataProvider>
      {({ historicalFilteredTransactions, accounts, budgets }) => (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Net Worth</CardTitle></CardHeader>
            <CardContent>
              <NetWorthChart transactions={historicalFilteredTransactions} accounts={accounts} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
            <CardContent>
              <SpendingByCategoryChart transactions={historicalFilteredTransactions} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Income vs. Expense</CardTitle></CardHeader>
            <CardContent>
              <IncomeVsExpenseChart transactions={historicalFilteredTransactions} />
            </CardContent>
          </Card>
        </div>
      )}
    </ReportDataProvider>
  );
};

export default EssentialReports;