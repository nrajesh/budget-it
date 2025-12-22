import React from 'react';
import ReportLayout from './ReportLayout';

const AdvancedReports: React.FC = () => {
  return (
    <ReportLayout
      title="Advanced Reports"
      description={<div>Advanced financial reports and analysis tools</div>}
    >
      {({ historicalFilteredTransactions, combinedFilteredTransactions, futureFilteredTransactions, accounts, budgets }) => (
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Advanced Report Data</h2>
          <p>Historical Transactions Count: {historicalFilteredTransactions.length}</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default AdvancedReports;