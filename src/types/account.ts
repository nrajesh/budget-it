export interface Account {
  id: string;
  name: string;
  currency: string;
  starting_balance: number;
  running_balance: number;
  remarks?: string | null;
  created_at: string;
}