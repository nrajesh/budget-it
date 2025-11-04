import { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Transaction } from '@/types/finance';

export const useTransactionFilters = () => {
  const { transactions } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1)),
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction: Transaction) => {
      const transactionDate = new Date(transaction.date);
      const isInDateRange = dateRange?.from && dateRange?.to
        ? transactionDate >= dateRange.from && transactionDate <= dateRange.to
        : true;
      
      const matchesSearch = searchTerm
        ? transaction.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesAccount = selectedAccounts.length > 0 ? selectedAccounts.includes(transaction.account) : true;
      const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(transaction.category) : true;

      return isInDateRange && matchesSearch && matchesAccount && matchesCategory;
    });
  }, [transactions, dateRange, searchTerm, selectedAccounts, selectedCategories]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAccounts([]);
    setSelectedCategories([]);
    setDateRange({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedAccounts,
    setSelectedAccounts,
    selectedCategories,
    setSelectedCategories,
    dateRange,
    setDateRange,
    filteredTransactions,
    handleResetFilters,
  };
};