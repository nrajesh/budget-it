"use client";

import { useState, useMemo } from 'react';
import { Transaction } from '@/types/finance';

const DEFAULT_PAGE_SIZE = 10;

export const useTransactionPagination = (transactions: Transaction[]) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const pageCount = useMemo(() => {
    return Math.ceil(transactions.length / pageSize);
  }, [transactions.length, pageSize]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return transactions.slice(startIndex, endIndex);
  }, [transactions, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageCount,
    paginatedTransactions,
  };
};