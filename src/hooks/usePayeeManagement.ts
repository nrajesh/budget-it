import { useState } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Payee } from "@/types/finance";
import Papa from "papaparse";
import { useToast } from "@/components/ui/use-toast";
import { createPayeesService } from "@/services/payeesService";
import { supabase } from "@/integrations/supabase/client";

const payeesService = createPayeesService(supabase);

export const usePayeeManagement = (isAccount: boolean) => {
  const { accounts, vendors, addPayee, updatePayee, deletePayee } = useTransactions();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayee, setSelectedPayee] = useState<Payee | undefined>(undefined);

  const data = isAccount ? accounts : vendors;

  const handleAdd = () => {
    setSelectedPayee(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (payee: Payee) => {
    setSelectedPayee(payee);
    setIsDialogOpen(true);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await payeesService.deletePayeesBatch(ids);
      toast({ title: "Success", description: `${ids.length} item(s) deleted.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedPayee?.id) {
        await updatePayee(selectedPayee.id, data);
        toast({ title: "Success", description: "Item updated." });
      } else {
        await addPayee(data);
        toast({ title: "Success", description: "Item added." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleImport = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const payees = results.data as any[];
        try {
          if (isAccount) {
            await payeesService.batchUpsertAccounts(payees);
          } else {
            const names = payees.map(p => p.name).filter(Boolean);
            await payeesService.batchUpsertVendors(names);
          }
          toast({ title: "Import Successful", description: `${payees.length} records imported.` });
        } catch (error: any) {
          toast({ title: "Import Failed", description: error.message, variant: "destructive" });
        }
      },
    });
  };

  return {
    data,
    isDialogOpen,
    setIsDialogOpen,
    selectedPayee,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSave,
    handleImport,
  };
};