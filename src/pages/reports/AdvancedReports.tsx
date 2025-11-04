import React from 'react';
import ReportDataProvider from './ReportDataProvider';
import { CashFlowForecastChart } from '@/components/charts/CashFlowForecastChart';
import { BudgetVsActualsChart } from '@/components/charts/BudgetVsActualsChart';
import { SpendingByPayeeChart } from '@/components/charts/SpendingByPayeeChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdvancedReports = () => {
  return (
    <ReportDataProvider>
      {({ historicalFilteredTransactions, combinedFilteredTransactions, futureFilteredTransactions, accounts, budgets }) => (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Cash Flow Forecast</CardTitle></CardHeader>
            <CardContent>
              <CashFlowForecastChart
                historicalTransactions={historicalFilteredTransactions}
                futureTransactions={futureFilteredTransactions}
                accounts={accounts}
              />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Budget vs. Actuals</CardTitle></CardHeader>
            <CardContent>
              <BudgetVsActualsChart transactions={combinedFilteredTransactions} budgets={budgets} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Spending by Payee</CardTitle></CardHeader>
            <CardContent>
              <SpendingByPayeeChart transactions={combinedFilteredTransactions} />
            </CardContent>
          </Card>
        </div>
      )}
    </ReportDataProvider>
  );
};

export default AdvancedReports;