"use client";

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });

  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useQuery<CategoryData[]>({
    queryKey: ['categoriesWithAmounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc('get_categories_with_transaction_counts', { user_id_param: user.id });
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        total_amount: parseFloat(d.total_amount),
      }));
    },
    enabled: !!user?.id && !selectedCategory,
  });

  const { data: drilledDownData, isLoading: isLoadingDrilledDown, error: drilledDownError } = useQuery<VendorTransactionData[]>({
    queryKey: ['transactionsByCategoryAndVendor', user?.id, selectedCategory?.name],
    queryFn: async () => {
      if (!user?.id || !selectedCategory?.name) return [];
      const { data, error } = await supabase.rpc('get_transactions_by_category_and_vendor', {
        p_user_id: user.id,
        p_category_name: selectedCategory.name,
      });
      if (error) throw error;
      return data.map((d: any) => ({
        vendor_name: d.vendor_name,
        total_amount: parseFloat(d.total_amount),
      }));
    },
    enabled: !!user?.id && !!selectedCategory,
  });

  const chartData = selectedCategory ? drilledDownData : categoriesData;
  const isLoading = selectedCategory ? isLoadingDrilledDown : isLoadingCategories;
  const error = selectedCategory ? drilledDownError : categoriesError;

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
            <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 px-2">
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
              onClick={(data) => {
                if (!selectedCategory) {
                  setSelectedCategory({ id: data.id, name: data.name });
                }
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryPieChart;