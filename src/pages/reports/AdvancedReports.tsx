import React from 'react';
import ReportLayout from './ReportLayout';

const AdvancedReports: React.FC = () => {
  return (
    <ReportLayout
      title="Advanced Reports"
      description={<div>Advanced financial reports and analysis tools</div>}
    >
      {({ historicalFilteredTransactions, combinedFilteredTransactions, futureFilteredTransactions, accounts, budgets }) => (
        // ... report content
      )}
    </ReportLayout>
  );
};

export default AdvancedReports;