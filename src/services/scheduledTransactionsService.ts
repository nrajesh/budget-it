import { supabase } from '@/integrations/supabase/client';

export interface ScheduledTransaction {
  id: string;
  user_id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency: string;
  remarks: string | null;
  created_at: string;
  last_processed_date: string | null;
  recurrence_end_date: string | null;
}

export const fetchScheduledTransactions = async (userId: string): Promise<ScheduledTransaction[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('scheduled_transactions')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching scheduled transactions:', error);
    throw error;
  }
  
  return data || [];
};