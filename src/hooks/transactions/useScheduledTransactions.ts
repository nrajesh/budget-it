"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/finance';

const fetchScheduled = async () => {
  const { data, error } = await supabase.from('scheduled_transactions').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const useScheduledTransactions = (refetchMain: () => void) => {
  const { data: scheduledTransactions, isLoading, error } = useQuery({
    queryKey: ['scheduled_transactions'],
    queryFn: fetchScheduled,
  });

  return { scheduledTransactions, isLoading, error };
};