import React from 'react';
import ReportLayout from './ReportLayout';

const EssentialReports: React.FC = () => {
  return (
    <ReportLayout
      title="Essential Reports"
      description="Core financial reports for your transactions"
    >
      {({ historicalFilteredTransactions, accounts, budgets }) => (
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Essential Report Data</h2>
          <p>Historical Transactions Count: {historicalFilteredTransactions.length}</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default EssentialReports;