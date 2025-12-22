export interface Payee {
  id: string;
  name: string;
  is_account: boolean;
  created_at: string;
  account_id: string | null;
  total_transactions?: number; // Added by RPC function
  
  // Account specific fields (if is_account is true)
  currency?: string;
  starting_balance?: number;
  remarks?: string | null;
  running_balance?: number;
}