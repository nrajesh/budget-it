"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCcw } from "lucide-react";
import { BudgetsTable } from "@/components/budgets/BudgetsTable";
import { AddEditBudgetDialog } from "@/components/budgets/AddEditBudgetDialog";
import { Budget } from "@/contexts/TransactionsContext"; // Import Budget type
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

const BudgetsPage = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | undefined>(undefined);

  const { data: budgets, isLoading: isLoadingBudgets, refetch: refetchBudgets } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  const saveBudgetMutation = useMutation({
    mutationFn: async (newBudget: Partial<Budget>) => {
      if (!user) throw new Error("User not authenticated.");
      if (newBudget.id) {
        const { data, error } = await supabase
          .from("budgets")
          .update({ ...newBudget, user_id: user.id })
          .eq("id", newBudget.id)
          .select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("budgets")
          .insert({ ...newBudget, user_id: user.id })
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget saved successfully.");
    },
    onError: (error) => {
      toast.error("Failed to save budget.");
      console.error("Budget mutation error:", error);
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget deleted successfully.");
    },
    onError: (error) => {
      toast.error("Failed to delete budget.");
      console.error("Delete budget error:", error);
    },
  });

  const handleAddBudget = () => {
    setSelectedBudget(undefined);
    setIsDialogOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsDialogOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudgetMutation.mutateAsync(id);
  };

  const handleSaveBudget = async (data: Partial<Budget>) => {
    await saveBudgetMutation.mutateAsync(data);
  };

  const handleRefresh = () => {
    refetchBudgets();
    toast.info("Budgets refreshed.");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Budgets</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Budgets</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddBudget}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Budget
            </Button>
          </div>
        </div>

        <BudgetsTable
          data={budgets || []}
          isLoading={isLoadingBudgets}
          onEdit={handleEditBudget}
          onDelete={handleDeleteBudget}
        />
      </div>

      <AddEditBudgetDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        budget={selectedBudget}
        onSave={handleSaveBudget}
        isSaving={saveBudgetMutation.isPending}
      />
    </div>
  );
};

export default BudgetsPage;