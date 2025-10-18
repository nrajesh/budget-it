"use client";

import React, { useState } from "react";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { useTransactions } from "@/contexts/TransactionsContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DemoDataProgressDialog } from "@/components/DemoDataProgressDialog";

const SettingsPage = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { generateDiverseDemoData, clearAllTransactions, demoDataProgress } = useTransactions();

  const [isDemoDataProgressDialogOpen, setIsDemoDataProgressDialogOpen] = useState(false);

  const handleGenerateDemoData = async () => {
    setIsDemoDataProgressDialogOpen(true);
    await generateDiverseDemoData();
    setIsDemoDataProgressDialogOpen(false);
  };

  const handleClearAllTransactions = async () => {
    await clearAllTransactions();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">General Settings</h2>
        <div className="grid gap-4 max-w-md">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="currency-select" className="text-right">
              Default Currency
            </Label>
            <Select
              value={selectedCurrency}
              onValueChange={setCurrency}
            >
              <SelectTrigger id="currency-select" className="col-span-2">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <div className="grid gap-4 max-w-md">
          <Button onClick={handleGenerateDemoData}>
            Generate Demo Data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear All Transactions</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  your transaction data and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllTransactions}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <DemoDataProgressDialog
        isOpen={isDemoDataProgressDialogOpen}
        onOpenChange={setIsDemoDataProgressDialogOpen}
      />
    </div>
  );
};

export default SettingsPage;