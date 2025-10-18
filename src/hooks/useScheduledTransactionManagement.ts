"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "./useUser";
import { useTransactions, ScheduledTransaction, Payee, Category } from "@/contexts/TransactionsContext"; // Corrected import types
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path

export const useScheduledTransactionManagement = () => {
  const { user, isLoadingUser } = useUser();
  const { accounts, vendors, categories, isLoadingAccounts, isLoadingVendors, isLoadingCategories, refetchTransactions: refetchMainTransactions } = useTransactions();
  const { convertBetweenCurrencies } = useCurrency();
  const queryClient = useQueryClient();

  const { data: scheduledTransactions, isLoading: isLoadingScheduledTransactions, refetch: refetchScheduledTransactions } = useQuery<ScheduledTransaction[]>({
    queryKey: ["scheduled_transactions"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("scheduled_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as ScheduledTransaction[];
    },
    enabled: !!user,
  });

  const allPayees = useMemo(() => {
    if (!accounts || !vendors) return [];
    return [
      ...accounts.map((p) => ({ value: p.name, label: p.name, isAccount: true })),
      ...vendors.map((p) => ({ value: p.name, label: p.name, isAccount: false })),
    ].sort((a, b) => a.label.localeCompare(b.label));
  }, [accounts, vendors]);

  const saveScheduledTransactionMutation = useMutation({
    mutationFn: async (newScheduledTransaction: Partial<ScheduledTransaction>) => {
      if (!user) throw new Error("User not authenticated.");
      if (newScheduledTransaction.id) {
        const { data, error } = await supabase
          .from("scheduled_transactions")
          .update({ ...newScheduledTransaction, user_id: user.id })
          .eq("id", newScheduledTransaction.id)
          .select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("scheduled_transactions")
          .insert({ ...newScheduledTransaction, user_id: user.id })
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_transactions"] });
      refetchMainTransactions(); // Also refetch main transactions as scheduled ones might affect them
      toast.success("Scheduled transaction saved successfully.");
    },
    onError: (error) => {
      toast.error("Failed to save scheduled transaction.");
      console.error("Scheduled transaction mutation error:", error);
    },
  });

  const deleteScheduledTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_transactions"] });
      refetchMainTransactions();
      toast.success("Scheduled transaction deleted successfully.");
    },
    onError: (error) => {
      toast.error("Failed to delete scheduled transaction.");
      console.error("Delete scheduled transaction error:", error);
    },
  });

  const saveScheduledTransaction = async (transaction: Partial<ScheduledTransaction>) => {
    await saveScheduledTransactionMutation.mutateAsync(transaction);
  };

  const deleteScheduledTransaction = async (id: string) => {
    await deleteScheduledTransactionMutation.mutateAsync(id);
  };

  return {
    scheduledTransactions,
    isLoadingScheduledTransactions,
    saveScheduledTransaction,
    deleteScheduledTransaction,
    allPayees,
    accounts,
    vendors,
    categories,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories,
    isSaving: saveScheduledTransactionMutation.isPending,
    isDeleting: deleteScheduledTransactionMutation.isPending,
    refetchScheduledTransactions,
  };
};