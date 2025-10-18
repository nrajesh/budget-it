"use client";

import React, { useState } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCcw } from "lucide-react";
import { PayeeTable } from "@/components/PayeeTable";
import { AddEditPayeeDialog } from "@/components/AddEditPayeeDialog";
import { Payee } from "@/contexts/TransactionsContext";

const AccountsPage = () => {
  const { accounts, isLoadingAccounts, invalidateAllData, refetchAccounts } = useTransactions();
  const { formatCurrency } = useCurrency();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayee, setSelectedPayee] = useState<Payee | undefined>(undefined);

  const handleAddAccount = () => {
    setSelectedPayee(undefined);
    setIsDialogOpen(true);
  };

  const handleEditAccount = (account: Payee) => {
    setSelectedPayee(account);
    setIsDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchAccounts();
    invalidateAllData();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Accounts</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Accounts</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddAccount}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Account
            </Button>
          </div>
        </div>

        <PayeeTable
          entityType="account"
          entityNamePlural="accounts"
          data={accounts || []}
          isLoading={isLoadingAccounts}
          onEdit={handleEditAccount}
          formatCurrency={formatCurrency}
          isAccountTable={true}
        />
      </div>

      <AddEditPayeeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        payee={selectedPayee}
        isAccount={true}
      />
    </div>
  );
};

export default AccountsPage;