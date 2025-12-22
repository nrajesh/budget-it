import React from 'react';
import ReportLayout from './ReportLayout';

const EssentialReports: React.FC = () => {
  return (
    <ReportLayout
      title="Essential Reports"
      description="Core financial reports for your transactions"
    >
      {({ historicalFilteredTransactions, accounts, budgets }) => (
        // ... report content
      )}
    </ReportLayout>
  );
};

export default EssentialReports;