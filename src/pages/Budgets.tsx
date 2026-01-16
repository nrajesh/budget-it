import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Budget } from "../types/budgets";
import { BudgetSummary } from "../components/budgets/BudgetSummary";
import { BudgetDialog } from "../components/budgets/BudgetDialog";
import { useToast } from "@/components/ui/use-toast";
import { useDataProvider } from "@/context/DataProviderContext";
import { useUser } from "@/contexts/UserContext";
import { PlusCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BudgetPaginationWrapper } from "../components/budgets/BudgetPaginationWrapper";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const dataProvider = useDataProvider();
  const { user } = useUser();
  const userId = user?.id || null;

  useEffect(() => {
    if (userId) {
        fetchBudgets(userId);
    } else {
        setIsLoading(false);
    }
  }, [userId]);

  const fetchBudgets = async (currentUserId: string) => {
    setIsLoading(true);
    try {
        const data = await dataProvider.getBudgetsWithSpending(currentUserId);
        setBudgets(data || []);
    } catch (error: any) {
        toast({
            title: "Error fetching budgets",
            description: error.message,
            variant: "destructive",
        });
    }
    setIsLoading(false);
  };

  const filteredBudgets = useMemo(() => {
    if (!searchTerm) {
      return budgets;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return budgets.filter(budget => 
      budget.category_name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [budgets, searchTerm]);

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

  const handleDeleteClick = (budgetId: string) => {
    setBudgetToDeleteId(budgetId);
    setIsConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDeleteId) return;

    try {
        await dataProvider.deleteBudget(budgetToDeleteId);
        toast({
            title: "Budget deleted",
            description: "The budget has been successfully deleted.",
        });
        handleSave();
    } catch (error: any) {
        toast({
            title: "Error deleting budget",
            description: error.message,
            variant: "destructive",
        });
    }

    setBudgetToDeleteId(null);
    setIsConfirmingDelete(false);
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
        <div className="mb-6">
          <Input
            placeholder="Search budgets by category name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-lg"
          />
        </div>

        <BudgetSummary budgets={filteredBudgets} isLoading={isLoading} />

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Budgets</h2>
          
          <BudgetPaginationWrapper
            budgets={filteredBudgets}
            isLoading={isLoading}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
          />
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

      <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected budget.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}