"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type

interface SpendingByVendorChartProps {
  transactions: Transaction[];
}

export const SpendingByVendorChart: React.FC<SpendingByVendorChartProps> = ({ transactions }) => {
  // Placeholder for chart logic
  const vendorSpending = transactions.reduce((acc, t) => {
    if (t.vendor) {
      acc[t.vendor] = (acc[t.vendor] || 0) + t.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedVendors = Object.entries(vendorSpending).sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Vendor</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedVendors.length > 0 ? (
          <ul>
            {sortedVendors.map(([vendor, amount]) => (
              <li key={vendor} className="flex justify-between py-1">
                <span>{vendor}</span>
                <span>{amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No spending data for vendors.</p>
        )}
      </CardContent>
    </Card>
  );
};