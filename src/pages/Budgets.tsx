import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, RotateCcw } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AddEditBudgetDialog } from "@/components/budgets/AddEditBudgetDialog.tsx";
import { Budget } from "@/data/finance-data";
import { BudgetsTable } from "@/components/budgets/BudgetsTable.tsx";
import LoadingOverlay from "@/components/LoadingOverlay";
import ConfirmationDialog from "@/components/ConfirmationDialog";

const BudgetsPage = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [budgetToDelete, setBudgetToDelete] = React.useState<Budget | null>(null);

  const { data: budgets = [], isLoading: isLoadingBudgets, refetch } = useQuery<Budget[], Error>({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('budgets')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data.map(b => ({ ...b, category_name: b.categories.name })) as Budget[];
    },
    enabled: !!user,
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Budget deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsConfirmOpen(false);
      setBudgetToDelete(null);
    },
    onError: (error: any) => showError(`Failed to delete budget: ${error.message}`),
  });

  const handleAddClick = () => {
    setSelectedBudget(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (budget: Budget) => {
    setBudgetToDelete(budget);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (budgetToDelete) {
      deleteBudgetMutation.mutate(budgetToDelete.id);
    }
  };

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isLoadingBudgets} message="Loading budgets..." />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Budget
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoadingBudgets}>
            {isLoadingBudgets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetsTable
            budgets={budgets}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>
      <AddEditBudgetDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        budget={selectedBudget}
        allBudgets={budgets}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title="Are you sure?"
        description="This will permanently delete the selected budget. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default BudgetsPage;