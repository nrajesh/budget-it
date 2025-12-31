import { UUID } from "crypto";

// Base type for entities that are also vendors (like accounts)
export interface Payee {
  id: UUID;
  name: string;
  is_account: boolean;
  created_at: string;
  account_id: UUID | null;
  // Fields added by RPC functions (get_vendors_with_transaction_counts)
  currency: string | null;
  starting_balance: number | null;
  remarks: string | null;
  running_balance: number | null;
  total_transactions: number;
}

// Type for Accounts (which are vendors where is_account=true)
export interface Account extends Payee {
  currency: string;
  starting_balance: number;
  running_balance: number;
}

// Type used for batch upserting accounts from CSV
export interface AccountUpsertType {
  name: string;
  currency: string;
  starting_balance: number;
  remarks: string | null;
}

export interface Category {
  id: UUID;
  user_id: UUID;
  name: string;
  created_at: string;
  // Field added by RPC function (get_categories_with_transaction_counts)
  total_transactions: number;
}

export interface Transaction {
  id: UUID;
  user_id: UUID;
  date: string;
  account: string;
  currency: string;
  vendor: string | null;
  amount: number;
  remarks: string | null;
  category: string;
  created_at: string;
  is_scheduled_origin: boolean;
  recurrence_id: UUID | null;
  recurrence_frequency: string | null;
  recurrence_end_date: string | null;
}