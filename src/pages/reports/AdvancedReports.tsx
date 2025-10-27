"use client";

import React from 'react';
import ReportLayout from './ReportLayout';
import TrendsAndAnalytics from './TrendsAndAnalytics';

const AdvancedReports = () => {
  return (
    <ReportLayout
      title="Advanced Reports"
      description="Deeper analysis of your spending habits and financial trends over time."
    >
      {({ historicalFilteredTransactions }) => (
        <div className="grid gap-6">
          <TrendsAndAnalytics transactions={historicalFilteredTransactions} />
        </div>
      )}
    </ReportLayout>
  );
};

export default AdvancedReports;