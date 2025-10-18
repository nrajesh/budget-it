"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type

interface SpendingCategoriesChartProps {
  transactions: Transaction[];
}

export const SpendingCategoriesChart: React.FC<SpendingCategoriesChartProps> = ({ transactions }) => {
  // Placeholder for chart logic
  const categorySpending = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categorySpending).sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedCategories.length > 0 ? (
          <ul>
            {sortedCategories.map(([category, amount]) => (
              <li key={category} className="flex justify-between py-1">
                <span>{category}</span>
                <span>{amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No spending data for categories.</p>
        )}
      </CardContent>
    </Card>
  );
};