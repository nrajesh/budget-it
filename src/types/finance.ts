export interface Payee {
  id: string;
  name: string;
  is_account: boolean;
  account_id?: string | null;
  currency?: string | null;
  starting_balance?: number | null;
  remarks?: string | null;
  running_balance?: number;
  total_transactions?: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  total_transactions?: bigint;
}

export interface Transaction {
  id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  currency: string;
  remarks?: string | null;
  user_id: string;
  created_at: string;
  transfer_id?: string | null;
}

export interface ScheduledTransaction {
  id: string;
  user_id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency: string;
  remarks?: string | null;
  created_at: string;
  last_processed_date?: string | null;
  recurrence_end_date?: string | null;
}