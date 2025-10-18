"use client";

import React, { useState } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCcw } from "lucide-react";
import { PayeeTable } from "@/components/PayeeTable";
import { AddEditPayeeDialog } from "@/components/AddEditPayeeDialog";
import { Payee } from "@/contexts/TransactionsContext"; // Import Payee type

const VendorsPage = () => {
  const { vendors, isLoadingVendors, invalidateAllData, refetchVendors } = useTransactions();
  const managementProps = usePayeeManagement(false); // false for vendors

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayee, setSelectedPayee] = useState<Payee | undefined>(undefined);

  const handleAddVendor = () => {
    setSelectedPayee(undefined);
    setIsDialogOpen(true);
  };

  const handleEditVendor = (vendor: Payee) => {
    setSelectedPayee(vendor);
    setIsDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchVendors();
    invalidateAllData();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Vendors</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Vendors</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddVendor}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor
            </Button>
          </div>
        </div>

        <PayeeTable
          entityType="vendor"
          entityNamePlural="vendors"
          data={vendors || []}
          isLoading={isLoadingVendors}
          onEdit={handleEditVendor}
          onDelete={managementProps.deletePayees}
          isAccountTable={false}
        />
      </div>

      <AddEditPayeeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        payee={selectedPayee}
        isAccount={false}
      />
    </div>
  );
};

export default VendorsPage;