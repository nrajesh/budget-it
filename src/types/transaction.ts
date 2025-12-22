export interface Transaction {
  id: string;
  date: string; // ISO date string
  amount: number;
  currency: string;
  remarks: string | null;
  created_at: string;
  user_id: string;
  
  // Transaction specific fields
  account: string;
  vendor: string | null;
  category: string;
  
  // Transfer fields
  transfer_id: string | null;
  
  // Scheduled fields
  is_scheduled_origin: boolean | null;
  recurrence_id: string | null;
  recurrence_frequency: string | null;
  recurrence_end_date: string | null;
}

export interface ScheduledTransaction extends Transaction {
  frequency: string;
  last_processed_date: string | null;
}