import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Budget } from "../types/budgets";
import { BudgetSummary } from "../components/budgets/BudgetSummary";
import { AddEditBudgetDialog } from "../components/budgets/AddEditBudgetDialog";
import { useToast } from "@/components/ui/use-toast";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";
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

  // Use Ledger Context
  const { activeLedger } = useLedger();
  const userId = activeLedger?.id || null;

  // Contexts for real-time calculation
  const { transactions, accounts, vendors, deleteBudget, hiddenBudgetIds } =
    useTransactions();
  const { convertBetweenCurrencies } = useCurrency();

  const fetchBudgets = useCallback(
    async (currentUserId: string) => {
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
    },
    [dataProvider, toast],
  );

  useEffect(() => {
    if (userId) {
      fetchBudgets(userId);
    } else {
      setIsLoading(false);
    }
  }, [userId, fetchBudgets]);

  // Recalculate spent amounts using shared logic
  const processedBudgets = useMemo(() => {
    // effectiveBudgets defined above, need to move it up or reference here?
    // Let's rely on 'budgets' state for this memo, but then filter 'processedBudgets'.
    return budgets.map((budget) => {
      const spent = calculateBudgetSpent(
        budget,
        transactions,
        accounts as any,
        vendors,
        convertBetweenCurrencies,
        budget.currency, // Calculate spent in the budget's currency
      );
      return { ...budget, spent_amount: spent };
    });
  }, [budgets, transactions, accounts, vendors, convertBetweenCurrencies]);

  const filteredBudgets = useMemo(() => {
    let base = processedBudgets;
    // Apply hidden filter
    if (hiddenBudgetIds.size > 0) {
      base = base.filter((b) => !hiddenBudgetIds.has(b.id));
    }

    if (!searchTerm) {
      return base;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return base.filter((budget) =>
      budget.category_name.toLowerCase().includes(lowerCaseSearchTerm),
    );
  }, [processedBudgets, searchTerm, hiddenBudgetIds]);

  // Separate spending budgets from goal budgets for summary calculations
  const spendingBudgets = useMemo(() => {
    return filteredBudgets.filter((b) => !b.is_goal);
  }, [filteredBudgets]);

  const activeBudgets = useMemo(() => {
    return filteredBudgets.filter((b) => b.is_active !== false);
  }, [filteredBudgets]);

  const inactiveBudgets = useMemo(() => {
    return filteredBudgets.filter((b) => b.is_active === false);
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
      deleteBudget(budgetToDeleteId);
      // Toast is handled by context now
      // handleSave(); // Not strictly needed if local state is just for initial load, but effectiveBudgets handles UI.
      // However, fetchBudgets creates 'budgets' state.
      // If we don't update 'budgets' state, effectiveBudgets filters it.
      // But if we reload, it's gone.
      // So simple delete is fine.
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
    <div className="space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            Budgets
          </h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
            Track your spending limits and goals
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSmartBudgetOpen(true)}>
            <Wand2 className="mr-2 h-4 w-4" />
            Smart Create
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="mb-6 flex gap-4">
          <Input
            placeholder="Search budgets by category name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm border-slate-200 dark:border-slate-800"
          />
        </div>

        <BudgetSummary budgets={spendingBudgets} isLoading={isLoading} />

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Budgets</h2>

          <BudgetPaginationWrapper
            budgets={activeBudgets}
            isLoading={isLoading}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
            transactions={transactions}
          />

          {inactiveBudgets.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                Inactive Budgets
              </h2>
              <BudgetPaginationWrapper
                budgets={inactiveBudgets}
                isLoading={isLoading}
                onEdit={handleOpenDialog}
                onDelete={handleDeleteClick}
                transactions={transactions}
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

      <AlertDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the selected budget.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
