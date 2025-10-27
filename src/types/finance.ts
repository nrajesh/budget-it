export interface Transaction {
  id: string;
  transfer_id: string | null;
  date: string;
  account: string;
  currency: string;
  vendor: string | null;
  amount: number;
  remarks: string | null;
  category: string;
  user_id: string | null;
  is_scheduled_origin: boolean | null;
  recurrence_id: string | null;
  recurrence_frequency: string | null;
  recurrence_end_date: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  total_transactions?: number;
}

export interface Vendor {
  id: string;
  name: string;
  is_account: boolean;
  account_id: string | null;
  created_at: string;
}

// Type returned by get_accounts_with_transaction_counts()
export interface Account {
  id: string; // Vendor ID
  name: string; // Vendor Name
  is_account: boolean;
  account_id: string; // Account table ID
  currency: string;
  starting_balance: number;
  remarks: string | null;
  running_balance: number;
  total_transactions: number;
}

export type AccountCurrencyMap = Record<string, string>;