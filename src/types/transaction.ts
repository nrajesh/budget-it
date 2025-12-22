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
  created_at: string;
  user_id: string | null;
  is_scheduled_origin: boolean | null;
  recurrence_id: string | null;
  recurrence_frequency: string | null;
  recurrence_end_date: string | null;
}