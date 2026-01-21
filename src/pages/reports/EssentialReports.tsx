
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
      {({ combinedFilteredTransactions, accounts, budgets, allTransactions }) => (
        <>
          <NetWorthStatement transactions={combinedFilteredTransactions} allTransactions={allTransactions} accounts={accounts} />
          <IncomeExpenseSummary transactions={combinedFilteredTransactions} budgets={budgets} />
          <TrendsAndAnalytics transactions={combinedFilteredTransactions} budgets={budgets} />
        </>
      )}
    </ReportLayout>
  );
};

export default EssentialReports;