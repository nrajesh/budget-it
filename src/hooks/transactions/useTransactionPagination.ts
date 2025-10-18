"use client";

import React, { useState, useMemo } from "react";
import { Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type

export const useTransactionPagination = (allTransactions: Transaction[]) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalItems = allTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const currentTransactions = useMemo(() => {
    return allTransactions.slice(startIndex, endIndex);
  }, [allTransactions, startIndex, endIndex]);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentTransactions,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  };
};