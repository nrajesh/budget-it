import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const BudgetVsActualsChart = ({ transactions, budgets }: { transactions: any[], budgets: any[] }) => {
  // Placeholder data
  const data = [
    { name: 'Groceries', budget: 500, actual: 400 },
    { name: 'Utilities', budget: 200, actual: 300 },
    { name: 'Transport', budget: 150, actual: 100 },
  ];

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="budget" fill="#8884d8" />
          <Bar dataKey="actual" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};