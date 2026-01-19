import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Budget } from "../types/budgets";
import { BudgetSummary } from "../components/budgets/BudgetSummary";
import { AddEditBudgetDialog } from "../components/budgets/AddEditBudgetDialog";
import { useToast } from "@/components/ui/use-toast";
import { useDataProvider } from "@/context/DataProviderContext";
import { useUser } from "@/contexts/UserContext";
import { PlusCircle, Wand2 } from "lucide-react";
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
import { SmartBudgetDialog } from "../components/budgets/SmartBudgetDialog";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateBudgetSpent } from "@/utils/budgetUtils";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSmartBudgetOpen, setIsSmartBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const dataProvider = useDataProvider();
  const { user } = useUser();
  const userId = user?.id || null;

  // Contexts for real-time calculation
  const { transactions, accounts, vendors } = useTransactions();
  const { convertBetweenCurrencies, selectedCurrency } = useCurrency();

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
      // We still fetch budgets to get the configuration, but we might ignore the returned 'spent_amount'
      // in favor of client-side calculation to match Alerts logic.
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

  // Recalculate spent amounts using shared logic
  const processedBudgets = useMemo(() => {
    return budgets.map(budget => {
      const spent = calculateBudgetSpent(
        budget,
        transactions,
        accounts,
        vendors,
        convertBetweenCurrencies,
        budget.currency // Calculate spent in the budget's currency
      );
      return { ...budget, spent_amount: spent };
    });
  }, [budgets, transactions, accounts, vendors, convertBetweenCurrencies]);

  const filteredBudgets = useMemo(() => {
    if (!searchTerm) {
      return processedBudgets;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return processedBudgets.filter(budget =>
      budget.category_name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [processedBudgets, searchTerm]);

  const activeBudgets = useMemo(() => {
    return filteredBudgets.filter(b => b.is_active !== false);
  }, [filteredBudgets]);

  const inactiveBudgets = useMemo(() => {
    return filteredBudgets.filter(b => b.is_active === false);
  }, [filteredBudgets]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Track your spending limits and goals</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
        </Button>
      </div>

      <div className="space-y-6">
        <div className="mb-6 flex gap-4">
          <Input
            placeholder="Search budgets by category name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-lg"
          />
          <Button variant="outline" onClick={() => setIsSmartBudgetOpen(true)}>
            <Wand2 className="mr-2 h-4 w-4" />
            Smart Create
          </Button>
        </div>

        <BudgetSummary budgets={filteredBudgets} isLoading={isLoading} />

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Budgets</h2>

          <BudgetPaginationWrapper
            budgets={activeBudgets}
            isLoading={isLoading}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
          />

          {inactiveBudgets.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Inactive Budgets</h2>
              <BudgetPaginationWrapper
                budgets={inactiveBudgets}
                isLoading={isLoading}
                onEdit={handleOpenDialog}
                onDelete={handleDeleteClick}
              />
            </div>
          )}
        </div>
      </div>

      {userId && (
        <AddEditBudgetDialog
          isOpen={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsDialogOpen(true);
          }}
          onSuccess={handleSave}
          budget={selectedBudget}
          allBudgets={budgets} // passing current budgets for duplicate check
        />
      )}

      <SmartBudgetDialog
        isOpen={isSmartBudgetOpen}
        onClose={() => setIsSmartBudgetOpen(false)}
        onSave={handleSave}
      />

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