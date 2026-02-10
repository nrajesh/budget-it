import * as React from "react";
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ThemedCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";

import { useTheme } from "@/contexts/ThemeContext";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { showSuccess, showError } from "@/utils/toast";
import { RotateCcw, RefreshCw, DatabaseZap } from "lucide-react";
import { useDataProvider } from "@/context/DataProviderContext";


import { ManageLedgerDialog } from "@/components/dialogs/ManageLedgerDialog";
import { CurrencyConversionDialog } from "@/components/dialogs/CurrencyConversionDialog";
import { useLedger } from "@/contexts/LedgerContext";

const SettingsPage = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();
  const { handleClearAllFilters } = useTransactionFilters();
  const { dashboardStyle, setDashboardStyle } = useTheme();
  const dataProvider = useDataProvider();
  const { activeLedger, updateLedgerDetails, refreshLedgers } = useLedger();
  const navigate = useNavigate();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = React.useState(false);
  const [isManageLedgerOpen, setIsManageLedgerOpen] = React.useState(false);
  const [isCreateLedgerOpen, setIsCreateLedgerOpen] = React.useState(false);
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = React.useState(false);
  const [futureMonths, setFutureMonths] = React.useState<number>(2);

  // Data Management State moved to DataManagementPage

  React.useEffect(() => {
    const savedMonths = localStorage.getItem('futureMonths');
    if (savedMonths) {
      setFutureMonths(parseInt(savedMonths, 10));
    }
  }, []);

  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);

    // Also update the active ledger's currency so it persists in exports
    if (activeLedger) {
      try {
        await updateLedgerDetails(activeLedger.id, { currency: value });
      } catch (error) {
        console.error("Failed to update ledger currency:", error);
      }
    }

    showSuccess(`Default currency set to ${value}.`);
  };

  const handleFutureMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setFutureMonths(value);
      localStorage.setItem('futureMonths', value.toString());
    }
  };

  const handleDashboardStyleChange = (value: string) => {
    setDashboardStyle(value as any);
    showSuccess(`Dashboard style set to ${value}.`);
  };

  const handleResetData = async () => {
    try {
      await dataProvider.clearAllData();
      // Refresh ledgers to ensure context is aware of the wipe
      await refreshLedgers();

      clearAllTransactions();
      handleClearAllFilters();

      // Clear non-filter persistent state if desired
      localStorage.removeItem('activeLedgerId');
      localStorage.removeItem('userLoggedOut');
      // filter_selectedAccounts is handled by handleClearAllFilters

      showSuccess("All application data has been reset.");

      // Navigate cleanly if needed, but context updates should trigger UI changes
      // window.location.assign('/ledgers'); // Removed hard reload
      navigate('/ledgers');
    } catch (error: any) {
      showError(`Failed to reset data: ${error.message}`);
    } finally {
      setIsResetConfirmOpen(false);
    }
  };

  const handleGenerateDemoData = async () => {
    // setIsDemoDataProgressDialogOpen(true); // Handled globally by context now
    try {
      await generateDiverseDemoData();
    } catch {
      // Ignore error during demo data generation
    } finally {
      setIsGenerateConfirmOpen(false);
    }
  };

  // Data Management Logic moved to DataManagementPage

  return (
    <div className="flex-1 space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            Settings
          </h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Manage application preferences and data</p>
        </div>
      </div>

      {/* Data Management Section Moved to /data-management */}

      {/* Ledger Settings Card */}
      <ThemedCard>
        <ThemedCardHeader>
          <ThemedCardTitle>Ledger Settings</ThemedCardTitle>
          <ThemedCardDescription>Manage your current ledger details or create a new one.</ThemedCardDescription>
        </ThemedCardHeader>
        <ThemedCardContent className="flex gap-4">
          <Button onClick={() => setIsManageLedgerOpen(true)} className="bg-primary text-primary-foreground">
            Edit Current Ledger
          </Button>
          <Button onClick={() => setIsCreateLedgerOpen(true)} variant="outline">
            Create New Ledger
          </Button>
        </ThemedCardContent>
      </ThemedCard>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-6">
        {/* Currency Selection Card */}
        <ThemedCard>
          <ThemedCardHeader>
            <ThemedCardTitle>Default Currency</ThemedCardTitle>
            <ThemedCardDescription>Select your preferred currency for display.</ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsCurrencyDialogOpen(true)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Currency Conversion
              </Button>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        {/* Dashboard Style Selection Card */}
        <ThemedCard>
          <ThemedCardHeader>
            <ThemedCardTitle>Dashboard Style</ThemedCardTitle>
            <ThemedCardDescription>Choose your preferred dashboard layout.</ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Select value={dashboardStyle} onValueChange={handleDashboardStyleChange}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="financial-pulse">Financial Pulse</SelectItem>
              </SelectContent>
            </Select>
          </ThemedCardContent>
        </ThemedCard>

        {/* Future Transactions Card */}
        <ThemedCard>
          <ThemedCardHeader>
            <ThemedCardTitle>Future Transactions</ThemedCardTitle>
            <ThemedCardDescription>
              Define how many months of future scheduled transactions to show.
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={futureMonths}
                onChange={handleFutureMonthsChange}
                onBlur={() => showSuccess(`Future transaction view set to ${futureMonths} months.`)}
                min="0"
                className="w-[100px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <span className="text-sm text-muted-foreground">months</span>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        {/* Reset Data Card */}
        <ThemedCard className="border-red-200/50 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10">
          <ThemedCardHeader>
            <ThemedCardTitle className="text-red-600 dark:text-red-400">Reset All Data</ThemedCardTitle>
            <ThemedCardDescription>Permanently delete all transaction, vendor, and account records.</ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Button variant="destructive" onClick={() => setIsResetConfirmOpen(true)}>
              <DatabaseZap className="mr-2 h-4 w-4" />
              Reset All Data
            </Button>
          </ThemedCardContent>
        </ThemedCard>

        {/* Generate Demo Data Card */}
        <ThemedCard>
          <ThemedCardHeader>
            <ThemedCardTitle>Generate Demo Data</ThemedCardTitle>
            <ThemedCardDescription>
              Generate diverse demo transactions. This will clear existing data first.
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Button onClick={() => setIsGenerateConfirmOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <RotateCcw className="mr-2 h-4 w-4" />
              Generate Data
            </Button>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Dialogs */}
      {/* Password Dialogs moved to DataManagementPage */}

      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        onConfirm={handleResetData}
        title="Are you sure you want to reset all data?"
        description="This action cannot be undone. All your transaction, vendor, and account data for ALL ledgers will be permanently deleted."
        confirmText="Reset Data"
      />

      <ConfirmationDialog
        isOpen={isGenerateConfirmOpen}
        onOpenChange={setIsGenerateConfirmOpen}
        onConfirm={handleGenerateDemoData}
        title="Generate new demo data?"
        description="This will clear all existing transactions and generate new diverse demo data. This action cannot be undone."
        confirmText="Generate"
      />

      <ManageLedgerDialog
        isOpen={isManageLedgerOpen}
        onOpenChange={setIsManageLedgerOpen}
        ledgerToEdit={activeLedger || undefined}
      />

      <ManageLedgerDialog
        isOpen={isCreateLedgerOpen}
        onOpenChange={setIsCreateLedgerOpen}
        ledgerToEdit={undefined}
      />

      <CurrencyConversionDialog
        isOpen={isCurrencyDialogOpen}
        onOpenChange={setIsCurrencyDialogOpen}
      />


    </div>
  );
};

export default SettingsPage;