import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useCurrency } from "@/contexts/CurrencyContext";

interface TrendForecastingChartProps {
  transactions: any[];
}

const TrendForecastingChart: React.FC<TrendForecastingChartProps> = ({ transactions }) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const chartData = React.useMemo(() => {
    // 1. Aggregate data by month
    const monthlyNet: { [key: string]: number } = {};
    transactions.forEach(t => {
      if (t.category !== 'Transfer') {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
        monthlyNet[monthKey] = (monthlyNet[monthKey] || 0) + convertedAmount;
      }
    });

    const sortedMonths = Object.keys(monthlyNet).sort();
    if (sortedMonths.length < 2) return []; // Not enough data for a trend

    const historicalData = sortedMonths.map((monthKey, index) => ({
      index,
      month: new Date(monthKey + '-02').toLocaleString('default', { month: 'short', year: '2-digit' }),
      actual: monthlyNet[monthKey],
    }));

    // 2. Linear Regression calculation
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = historicalData.length;

    historicalData.forEach(point => {
      sumX += point.index;
      sumY += point.actual;
      sumXY += point.index * point.actual;
      sumX2 += point.index * point.index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 3. Generate forecast data for the next 6 months
    const forecastMonths = 6;
    const combinedData = historicalData.map(point => ({
      ...point,
      forecast: slope * point.index + intercept,
    }));

    for (let i = 0; i < forecastMonths; i++) {
      const futureIndex = n + i;
      const futureDate = new Date(sortedMonths[n - 1] + '-02');
      futureDate.setMonth(futureDate.getMonth() + i + 1);
      
      combinedData.push({
        index: futureIndex,
        month: futureDate.toLocaleString('default', { month: 'short', year: '2-digit' }),
        actual: null, // No actual data for future months
        forecast: slope * futureIndex + intercept,
      });
    }

    return combinedData;
  }, [transactions, selectedCurrency, convertBetweenCurrencies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Income Trend & Forecast</CardTitle>
        <CardDescription>
          Historical net income with a 6-month forecast based on a linear trend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
              <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual Net Income" />
              <Line type="monotone" dataKey="forecast" stroke="#82ca9d" strokeDasharray="5 5" name="Forecasted Trend" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-center">
            <p className="text-muted-foreground">
              Not enough data to generate a forecast. At least two months of transactions are required.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendForecastingChart;