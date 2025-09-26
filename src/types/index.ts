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

export type ColumnDefinition<T> = {
  accessor: keyof T | string | ((item: T) => ReactNode);
  header: string;
  render?: (item: T) => ReactNode;
};