import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const SpendingByPayeeChart = ({ transactions }: { transactions: any[] }) => {
  // Placeholder data
  const data = [
    { name: 'Starbucks', value: 200 },
    { name: 'Amazon', value: 500 },
    { name: 'Walmart', value: 350 },
  ];

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={80} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" name="Spending" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};