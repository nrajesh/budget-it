"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface TransactionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  transaction?: any; // Optional, for editing existing transactions
  onClose: () => void;
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  setIsOpen,
  transaction,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [account, setAccount] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (transaction) {
      setDate(new Date(transaction.date));
      setAccount(transaction.account);
      setVendor(transaction.vendor);
      setCategory(transaction.category);
      setAmount(transaction.amount.toString());
      setRemarks(transaction.remarks || "");
    } else {
      // Reset form for new transaction
      setDate(new Date());
      setAccount("");
      setVendor("");
      setCategory("");
      setAmount("");
      setRemarks("");
    }
  }, [transaction, isOpen]);

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("name")
        .eq("is_account", true);
      if (error) throw error;
      return data.map((acc) => acc.name);
    },
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("name");
      if (error) throw error;
      return data.map((cat) => cat.name);
    },
  });

  const { data: vendors, isLoading: isLoadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("name")
        .eq("is_account", false);
      if (error) throw error;
      return data.map((ven) => ven.name);
    },
  });

  const addOrUpdateTransaction = useMutation({
    mutationFn: async (newTransaction: any) => {
      if (transaction) {
        const { data, error } = await supabase
          .from("transactions")
          .update(newTransaction)
          .eq("id", transaction.id)
          .select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("transactions")
          .insert(newTransaction)
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success(
        `Transaction ${transaction ? "updated" : "added"} successfully.`
      );
      setIsOpen(false);
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to ${transaction ? "update" : "add"} transaction.`);
      console.error("Transaction mutation error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !account || !category || !amount) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const transactionData = {
      date: format(date, "yyyy-MM-dd"),
      account,
      vendor: vendor || null, // Vendor can be optional
      category,
      amount: parseFloat(amount),
      remarks: remarks || null,
      currency: "USD", // Default currency, can be made dynamic if needed
    };

    addOrUpdateTransaction.mutate(transactionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add New Transaction"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <div className="col-span-3">
              <DatePicker date={date} setDate={setDate} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="account" className="text-right">
              Account
            </Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger id="account" className="col-span-3">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAccounts ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  accounts?.map((acc) => (
                    <SelectItem key={acc} value={acc}>
                      {acc}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vendor" className="text-right">
              Vendor
            </Label>
            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger id="vendor" className="col-span-3">
                <SelectValue placeholder="Select a vendor (optional)" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingVendors ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  vendors?.map((ven) => (
                    <SelectItem key={ven} value={ven}>
                      {ven}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCategories ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  categories?.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="remarks" className="text-right">
              Remarks
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addOrUpdateTransaction.isPending}>
              {transaction ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;