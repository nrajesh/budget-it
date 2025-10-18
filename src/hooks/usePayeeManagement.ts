"use client";

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTransactions, Payee } from "@/contexts/TransactionsContext"; // Import useTransactions and Payee type

interface PayeeFormValues {
  name: string;
  is_account: boolean;
  currency?: string;
  starting_balance?: number;
  remarks?: string;
}

export const usePayeeManagement = (isAccount: boolean) => {
  const { invalidateAllData } = useTransactions(); // Use invalidateAllData from context
  const navigate = useNavigate();

  const addPayeeMutation = useMutation({
    mutationFn: async (values: PayeeFormValues) => {
      if (values.is_account) {
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .insert({
            currency: values.currency || "USD",
            starting_balance: values.starting_balance || 0,
            remarks: values.remarks,
          })
          .select()
          .single();

        if (accountError) throw accountError;

        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .insert({
            name: values.name,
            is_account: true,
            account_id: accountData.id,
          })
          .select();

        if (vendorError) throw vendorError;
        return vendorData;
      } else {
        const { data, error } = await supabase
          .from("vendors")
          .insert({ name: values.name, is_account: false })
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success(`${isAccount ? "Account" : "Vendor"} added successfully.`);
    },
    onError: (error) => {
      toast.error(`Failed to add ${isAccount ? "account" : "vendor"}.`);
      console.error("Add payee error:", error);
    },
  });

  const updatePayeeMutation = useMutation({
    mutationFn: async (
      { id, values }: { id: string; values: PayeeFormValues }
    ) => {
      if (values.is_account) {
        // First, get the existing vendor to find the account_id
        const { data: existingVendor, error: fetchError } = await supabase
          .from("vendors")
          .select("account_id")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        if (!existingVendor?.account_id)
          throw new Error("Account ID not found for vendor.");

        // Update the associated account
        const { error: accountError } = await supabase
          .from("accounts")
          .update({
            currency: values.currency || "USD",
            starting_balance: values.starting_balance || 0,
            remarks: values.remarks,
          })
          .eq("id", existingVendor.account_id);

        if (accountError) throw accountError;

        // Update the vendor name
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .update({ name: values.name })
          .eq("id", id)
          .select();

        if (vendorError) throw vendorError;
        return vendorData;
      } else {
        const { data, error } = await supabase
          .from("vendors")
          .update({ name: values.name })
          .eq("id", id)
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success(`${isAccount ? "Account" : "Vendor"} updated successfully.`);
    },
    onError: (error) => {
      toast.error(`Failed to update ${isAccount ? "account" : "vendor"}.`);
      console.error("Update payee error:", error);
    },
  });

  const deletePayeesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.rpc("delete_payees_batch", { p_vendor_ids: ids });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateAllData();
      toast.success(`${isAccount ? "Accounts" : "Vendors"} deleted successfully.`);
    },
    onError: (error) => {
      toast.error(`Failed to delete ${isAccount ? "accounts" : "vendors"}.`);
      console.error("Delete payees error:", error);
    },
  });

  const addPayee = async (values: PayeeFormValues) => {
    await addPayeeMutation.mutateAsync(values);
  };

  const updatePayee = async (id: string, values: PayeeFormValues) => {
    await updatePayeeMutation.mutateAsync({ id, values });
  };

  const deletePayees = async (ids: string[]) => {
    await deletePayeesMutation.mutateAsync(ids);
  };

  return {
    addPayee,
    updatePayee,
    deletePayees,
    isAdding: addPayeeMutation.isPending,
    isUpdating: updatePayeeMutation.isPending,
    isDeleting: deletePayeesMutation.isPending,
  };
};