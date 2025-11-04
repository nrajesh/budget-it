import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const CashFlowForecastChart = ({ historicalTransactions, futureTransactions, accounts }: { historicalTransactions: any[], futureTransactions: any[], accounts: any[] }) => {
  // Placeholder data
  const data = [
    { name: 'Jan', value: 1200 },
    { name: 'Feb', value: 2100 },
    { name: 'Mar', value: 1500 },
    { name: 'Apr', value: 2500 },
  ];

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" name="Forecast" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};