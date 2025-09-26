import { ReactNode } from "react";

export interface Transaction {
  id: string;
  date: string;
  account: string;
  vendor: string | null;
  category: string;
  amount: number;
  currency: string;
  remarks: string | null;
  created_at: string;
  transfer_id: string | null;
  user_id: string;
  is_scheduled_origin: boolean | null;
  recurrence_id: string | null;
  recurrence_frequency: string | null; // Added missing field
  recurrence_end_date: string | null; // Added missing field
}

export interface Payee {
  id: string;
  name: string;
  is_account: boolean;
  account_id: string | null;
  currency?: string;
  starting_balance?: number;
  running_balance?: number;
  total_transactions: number;
}

export interface Category { // Exporting Category interface
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  totalTransactions?: number;
}

export type ColumnDefinition<T> = {
  accessor: keyof T | string | ((item: T) => ReactNode);
  header: string;
  render?: (item: T) => ReactNode;
};