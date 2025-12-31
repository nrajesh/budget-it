import { UUID } from "crypto";

export interface Account {
  id: UUID;
  name: string;
  is_account: boolean;
  created_at: string;
  account_id: UUID | null;
  currency: string;
  starting_balance: number;
  remarks: string | null;
  running_balance: number;
  total_transactions: number;
}

export interface AccountUpsertType {
  name: string;
  currency: string;
  starting_balance: number;
  remarks: string | null;
}

export interface Category {
  id: UUID;
  name: string;
  user_id: UUID;
  created_at: string;
  total_transactions: number;
}

export interface Transaction {
  id: UUID;
  date: string;
  account: string;
  currency: string;
  vendor: string | null;
  amount: number;
  remarks: string | null;
  category: string;
  user_id: UUID;
}