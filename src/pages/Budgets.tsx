import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Budget } from "@/types/budgets";
import { BudgetSummary } from "@/components/budgets/BudgetSummary";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetDialog } from "@/components/budgets/BudgetDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchBudgets(user.id);
      } else {
        setIsLoading(false);
      }
    };
    getUser();
  }, []);

  const fetchBudgets = async (currentUserId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_budgets_with_spending', {
      p_user_id: currentUserId,
    });

    if (error) {
      toast({
        title: "Error fetching budgets",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setBudgets(data || []);
    }
    setIsLoading(false);
  };

  const handleOpenDialog = (budget: Budget | null = null) => {
    setSelectedBudget(budget);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedBudget(null);
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (userId) {
      fetchBudgets(userId);
    }
  };

  const handleDelete = async (budgetId: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
    if (error) {
      toast({
        title: "Error deleting budget",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Budget deleted",
        description: "The budget has been successfully deleted.",
      });
      handleSave();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
        </Button>
      </div>

      <div className="space-y-6">
        <BudgetSummary budgets={budgets} isLoading={isLoading} />

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Budgets</h2>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : budgets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">No budgets found</h3>
              <p className="text-sm text-muted-foreground">
                Get started by creating your first budget.
              </p>
            </div>
          )}
        </div>
      </div>

      {userId && (
        <BudgetDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSave}
          budget={selectedBudget}
          userId={userId}
        />
      )}
    </div>
  );
}