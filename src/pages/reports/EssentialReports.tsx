"use client";

import React, { useContext } from "react";
import { ReportLayoutContext } from "./ReportLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const EssentialReports = () => {
  const context = useContext(ReportLayoutContext);

  if (!context) {
    return <div>Loading report data...</div>;
  }

  const { filteredTransactions, isLoadingTransactions, selectedCurrency, formatCurrency } = context;

  if (isLoadingTransactions) {
    return <div className="text-center py-8">Loading essential report data...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Essential Spending Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total transactions: {filteredTransactions.length}</p>
          <p>Total amount: {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0), selectedCurrency)}</p>
          <p className="text-gray-500">
            (This is a placeholder for essential charts and summaries.)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Get a quick overview of your financial health.</p>
          <p className="text-gray-500">
            (e.g., top categories, average daily spending)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EssentialReports;