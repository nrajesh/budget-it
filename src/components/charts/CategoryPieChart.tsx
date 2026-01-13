"use client";

import React, { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ActivePieShape } from './ActivePieShape'; // Import the new component
import { useCurrency } from '@/contexts/CurrencyContext'; // Assuming useCurrency is available for formatCurrency
import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/contexts/UserContext';

interface CategoryData {
  id: string;
  name: string;
  total_amount: number;
}

interface VendorTransactionData {
  vendor_name: string;
  total_amount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#36A2EB', '#FFCE56', '#FF6384'];

const CategoryPieChart = () => {
  const { formatCurrency, convertBetweenCurrencies } = useCurrency(); // Get formatCurrency from context
  const { transactions, categories, isLoadingTransactions } = useTransactions();
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null); // Local activeIndex for current view

  // Calculate category data from transactions in context
  const categoriesData = React.useMemo(() => {
      if (!transactions || !categories) return [];

      const categoryMap = new Map<string, number>();

      transactions.forEach(t => {
          // Expenses only usually for pie chart? Or net?
          // Usually pie charts show Expenses.
          if (t.amount < 0 && t.category) {
              const current = categoryMap.get(t.category) || 0;
              categoryMap.set(t.category, current + Math.abs(t.amount));
          }
      });

      return Array.from(categoryMap.entries()).map(([name, amount], index) => ({
          id: categories.find(c => c.name === name)?.id || `cat-${index}`,
          name: name,
          total_amount: amount
      })).filter(c => c.total_amount > 0).sort((a, b) => b.total_amount - a.total_amount);
  }, [transactions, categories]);

  // Calculate drilldown data
  const drilledDownData = React.useMemo(() => {
      if (!selectedCategory || !transactions) return [];

      const vendorMap = new Map<string, number>();

      transactions.filter(t => t.category === selectedCategory.name && t.amount < 0).forEach(t => {
          const vendor = t.vendor || "Unknown";
          const current = vendorMap.get(vendor) || 0;
          vendorMap.set(vendor, current + Math.abs(t.amount));
      });

      return Array.from(vendorMap.entries()).map(([name, amount]) => ({
          vendor_name: name,
          total_amount: amount
      })).sort((a, b) => b.total_amount - a.total_amount);
  }, [selectedCategory, transactions]);

  const chartData = selectedCategory ? drilledDownData : categoriesData;
  const isLoading = isLoadingTransactions;
  const error = null;

  const chartData = selectedCategory ? drilledDownData : categoriesData;
  const isLoading = selectedCategory ? isLoadingDrilledDown : isLoadingCategories;
  const error = selectedCategory ? drilledDownError : categoriesError;

  const onPieClick = useCallback((data: any, index: number) => {
    if (!selectedCategory) {
      // If in top-level categories, set active index and drill down
      setActiveIndex(index);
      setSelectedCategory({ id: data.id, name: data.name });
    } else {
      // If drilled down, just toggle active index for the vendor
      setActiveIndex(prevIndex => (prevIndex === index ? null : index));
    }
  }, [selectedCategory]);

  const handleBackClick = useCallback(() => {
    setSelectedCategory(null);
    setActiveIndex(null); // Clear active index when going back
  }, []);

  const resetActiveIndex = useCallback(() => {
    setActiveIndex(null);
  }, []);

  if (isLoading) return <div className="flex justify-center items-center h-64">Loading chart data...</div>;
  if (error) return <div className="text-red-500 text-center py-4">Error loading chart data: {error.message}</div>;
  if (!chartData || chartData.length === 0) return <div className="text-center py-4">No data to display.</div>;

  const renderLabel = ({ name, percent }: { name: string; percent: number }) => {
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {selectedCategory ? (
            <Button variant="ghost" onClick={handleBackClick} className="flex items-center gap-2 px-2">
              <ArrowLeft className="h-4 w-4" /> Back to Categories
            </Button>
          ) : (
            "Category Spending Overview"
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={150}
              fill="#8884d8"
              dataKey="total_amount"
              nameKey={selectedCategory ? "vendor_name" : "name"}
              activeIndex={activeIndex}
              activeShape={(props) => activeIndex !== null ? <ActivePieShape {...props} formatCurrency={formatCurrency} onCenterClick={resetActiveIndex} /> : null}
              onClick={onPieClick}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryPieChart;