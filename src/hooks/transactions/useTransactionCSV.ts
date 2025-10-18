"use client";

import React from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/hooks/useUser";
import { Transaction, Payee } from "@/contexts/TransactionsContext"; // Import Transaction and Payee types
import { format } from "date-fns";

const formatDateToDDMMYYYY = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return format(date, "dd/MM/yyyy");
};

export const useTransactionCSV = () => {
  const {
    transactions,
    refetchTransactions,
    refetchVendors,
    refetchAccounts,
    accountCurrencyMap,
  } = useTransactions();
  const { user } = useUser();

  const importTransactionsMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            if (!user) {
              toast.error("User not authenticated.");
              return reject("User not authenticated.");
            }

            const vendorsToUpsert: string[] = [];
            const accountsToUpsert: { name: string; currency: string; starting_balance: number; remarks?: string }[] = [];

            const transactionsToInsert = results.data.map((row: any) => {
              const isAccount = row.IsAccount?.toLowerCase() === "true";
              const payeeName = row.Account || row.Vendor; // Use Account for accounts, Vendor for others

              if (payeeName && !isAccount && !vendorsToUpsert.includes(payeeName)) {
                vendorsToUpsert.push(payeeName);
              } else if (payeeName && isAccount && !accountsToUpsert.some(acc => acc.name === payeeName)) {
                accountsToUpsert.push({
                  name: payeeName,
                  currency: row.Currency || "USD",
                  starting_balance: parseFloat(row["Starting Balance"] || 0),
                  remarks: row.Remarks,
                });
              }

              return {
                date: row.Date,
                account: row.Account,
                vendor: row.Vendor,
                category: row.Category,
                amount: parseFloat(row.Amount),
                remarks: row.Remarks,
                currency: row.Currency || "USD",
                user_id: user.id,
                transfer_id: row.transfer_id || null,
                is_scheduled_origin: row.is_scheduled_origin?.toLowerCase() === "true",
                recurrence_frequency: row.Frequency === "None" ? null : row.Frequency,
                recurrence_end_date: row["End Date"] || null,
              };
            });

            // Upsert vendors
            if (vendorsToUpsert.length > 0) {
              const { error: vendorUpsertError } = await supabase.rpc("batch_upsert_vendors", { p_names: vendorsToUpsert });
              if (vendorUpsertError) {
                console.error("Vendor upsert error:", vendorUpsertError);
                toast.error("Failed to import some vendors.");
              }
            }

            // Upsert accounts
            if (accountsToUpsert.length > 0) {
              const { error: accountUpsertError } = await supabase.rpc("batch_upsert_accounts", { p_accounts: accountsToUpsert });
              if (accountUpsertError) {
                console.error("Account upsert error:", accountUpsertError);
                toast.error("Failed to import some accounts.");
              }
            }

            const { data, error } = await supabase
              .from("transactions")
              .insert(transactionsToInsert)
              .select();
            if (error) return reject(error);
            resolve(data);
          },
          error: (error: any) => {
            reject(error);
          },
        });
      });
    },
    onSuccess: () => {
      refetchTransactions();
      refetchVendors();
      refetchAccounts();
      toast.success("Transactions imported successfully.");
    },
    onError: (error) => {
      toast.error("Failed to import transactions.");
      console.error("Import error:", error);
    },
  });

  const exportTransactionsToCsv = () => {
    if (!transactions || transactions.length === 0) {
      toast.info("No transactions to export.");
      return;
    }

    const dataToExport = transactions.map((t) => ({
      "Date": formatDateToDDMMYYYY(t.date),
      "Account": t.account,
      "Vendor": t.vendor,
      "Category": t.category,
      "Amount": t.amount,
      "Remarks": t.remarks,
      "Currency": t.currency,
      "transfer_id": t.transfer_id || null,
      "is_scheduled_origin": t.is_scheduled_origin || false,
      "Frequency": t.recurrence_frequency || "None",
      "End Date": t.recurrence_end_date ? formatDateToDDMMYYYY(t.recurrence_end_date) : "",
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transactions exported successfully.");
  };

  return {
    importTransactions: importTransactionsMutation.mutateAsync,
    exportTransactionsToCsv,
    isImporting: importTransactionsMutation.isPending,
  };
};