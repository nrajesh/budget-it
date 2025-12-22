export interface Payee {
  id: string;
  name: string;
  is_account: boolean;
  created_at: string;
  account_id: string | null;
  currency: string;
  starting_balance: number;
  remarks: string | null;
  running_balance: number;
  total_transactions: number;
}