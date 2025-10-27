"use client";

import { useState } from 'react';
import { SortingState } from '@tanstack/react-table';

export const useTransactionSorting = () => {
  const [sorting, setSorting] = useState<SortingState>([]);

  return { sorting, setSorting };
};