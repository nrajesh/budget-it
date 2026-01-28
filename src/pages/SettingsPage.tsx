import * as React from "react";
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ThemedCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useTheme } from "@/contexts/ThemeContext";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { showSuccess, showError } from "@/utils/toast";
import { RotateCcw, DatabaseZap, Upload, FileLock, FileJson, AlertCircle, RefreshCw } from "lucide-react";
import { useDataProvider } from "@/context/DataProviderContext";
import { encryptData, decryptData } from "@/utils/crypto";
import PasswordDialog from "@/components/dialogs/PasswordDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


import { ManageLedgerDialog } from "@/components/dialogs/ManageLedgerDialog";
import { CurrencyConversionDialog } from "@/components/dialogs/CurrencyConversionDialog";
import { useLedger } from "@/contexts/LedgerContext";

const SettingsPage = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();
  const { dashboardStyle, setDashboardStyle } = useTheme();
  const dataProvider = useDataProvider();
  const { handleClearAllFilters } = useTransactionFilters();
  const { activeLedger, updateLedgerDetails } = useLedger();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = React.useState(false);
  const [isManageLedgerOpen, setIsManageLedgerOpen] = React.useState(false);
  const [isCreateLedgerOpen, setIsCreateLedgerOpen] = React.useState(false);
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = React.useState(false);
  const [futureMonths, setFutureMonths] = React.useState<number>(2);

  // Data Management State
  const [isExportPasswordOpen, setIsExportPasswordOpen] = React.useState(false);
  const [isImportPasswordOpen, setIsImportPasswordOpen] = React.useState(false);
  const [tempImportFile, setTempImportFile] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      clearAllTransactions();
      handleClearAllFilters();
      showSuccess("All application data has been reset.");
      window.location.href = '/ledgers';
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
    } catch (error: any) {
    } finally {
      setIsGenerateConfirmOpen(false);
    }
  };

  // --- Export Logic ---
  const saveFile = async (filename: string, content: string, description: string) => {
    try {
      // Try File System Access API first (Chrome/Edge/Desktop)
      // @ts-ignore - showSaveFilePicker is not yet in all TS definitions
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: description,
            accept: { 'application/json': ['.json', '.lock'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return true;
      }
      throw new Error("File System Access API not supported");
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error("Save cancelled by user");
      }

      // Fallback to classic download
      const element = document.createElement("a");
      const file = new Blob([content], { type: "application/json" });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      return false; // Indicates fallback was used
    }
  };

  const handleExportPlain = async () => {
    try {
      const data = await dataProvider.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const filename = `budget_backup_${new Date().toISOString().split('T')[0]}.json`;

      const usedPicker = await saveFile(filename, jsonString, "Budget It Full Backup (All Ledgers)");

      if (usedPicker) {
        showSuccess("File saved successfully!");
      } else {
        showSuccess("File downloaded via browser manager.");
      }
    } catch (e: any) {
      if (e.message !== "Save cancelled by user") {
        showError(`Export failed: ${e.message}`);
      }
    }
  };

  const handleExportEncryptedParams = async (password: string) => {
    try {
      const data = await dataProvider.exportData();
      const jsonString = JSON.stringify(data);
      const encrypted = await encryptData(jsonString, password);
      const filename = `budget_backup_enc_${new Date().toISOString().split('T')[0]}.lock`;

      const usedPicker = await saveFile(filename, encrypted, "Budget It Full Backup (Encrypted)");

      if (usedPicker) {
        showSuccess("Encrypted file saved successfully!");
      } else {
        showSuccess("Encrypted file downloaded via browser manager.");
      }
    } catch (e: any) {
      if (e.message !== "Save cancelled by user") {
        showError(`Encryption failed: ${e.message}`);
      }
    }
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        // Try parsing as simple JSON first to see if it's a plain backup
        JSON.parse(content);
        // If successful, it might be plain or the encrypted wrapper (which is also JSON)
        // Check structure
        const parsed = JSON.parse(content);
        if (parsed.ciphertext && parsed.iv && parsed.salt) {
          // It's encrypted
          setTempImportFile(content);
          setIsImportPasswordOpen(true);
        } else {
          // Assume plain text
          await dataProvider.importData(parsed);
          showSuccess("Data imported successfully!");
          // Optional: reload or refresh
          window.location.reload();
        }
      } catch (e) {
        showError("Invalid file format.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const handleImportEncryptedParams = async (password: string) => {
    if (!tempImportFile) return;
    try {
      const decryptedParams = await decryptData(tempImportFile, password);
      const data = JSON.parse(decryptedParams);
      await dataProvider.importData(data);
      showSuccess("Encrypted data imported successfully!");
      setTempImportFile(null);
      window.location.reload();
    } catch (e: any) {
      showError(`Import failed: ${e.message}`);
    }
  };

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

      {/* Data Management Section */}
      <ThemedCard className="mt-6 border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
        <ThemedCardHeader>
          <ThemedCardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">Data Management</ThemedCardTitle>
          <ThemedCardDescription>
            Export your data to a local file. This will include <strong>all ledgers</strong> and their associated data.
          </ThemedCardDescription>
        </ThemedCardHeader>
        <ThemedCardContent className="space-y-4">
          <Alert className="bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">Important</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Since this is a local-first app, if you clear your browser data, you will lose your records.
              Please export regular backups.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button onClick={handleExportPlain} variant="outline" className="bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40">
                <FileJson className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button onClick={() => setIsExportPasswordOpen(true)} variant="outline" className="bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40">
                <FileLock className="mr-2 h-4 w-4" />
                Export Encrypted
              </Button>
            </div>

            <div className="w-px bg-border hidden sm:block"></div>

            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json,.lock"
              />
              <Button onClick={handleImportClick} variant="secondary">
                <Upload className="mr-2 h-4 w-4" />
                Import Backup
              </Button>
            </div>
          </div>
        </ThemedCardContent>
      </ThemedCard>

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
      <PasswordDialog
        isOpen={isExportPasswordOpen}
        onOpenChange={setIsExportPasswordOpen}
        onConfirm={handleExportEncryptedParams}
        title="Encrypt Backup"
        description="Enter a password to encrypt your backup file. You will need this password to restore your data."
        confirmText="Encrypt & Download"
      />

      <PasswordDialog
        isOpen={isImportPasswordOpen}
        onOpenChange={setIsImportPasswordOpen}
        onConfirm={handleImportEncryptedParams}
        title="Decrypt Backup"
        description="This file is encrypted. Please enter the password to restore your data."
        confirmText="Decrypt & Import"
      />

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