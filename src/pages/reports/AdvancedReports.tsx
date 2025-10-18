"use client";

import React, { useContext } from "react";
import { ReportLayoutContext } from "./ReportLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AdvancedReports = () => {
  const context = useContext(ReportLayoutContext);

  if (!context) {
    return <div>Loading report data...</div>;
  }

  const { filteredTransactions, isLoadingTransactions, selectedCurrency, formatCurrency } = context;

  if (isLoadingTransactions) {
    return <div className="text-center py-8">Loading advanced report data...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Spending Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total transactions: {filteredTransactions.length}</p>
          <p>Total amount: {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0), selectedCurrency)}</p>
          <p className="text-gray-500">
            (This is a placeholder for advanced charts and detailed reports.)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Section</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Here you can add more specific charts or data tables.</p>
          <p className="text-gray-500">
            (e.g., trend analysis, budget vs actual, net worth over time)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedReports;