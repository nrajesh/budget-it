import * as React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileJson,
  FileLock,
  Upload,
  AlertCircle,
  RotateCcw,
  DatabaseZap,
} from "lucide-react";
import { useDataProvider } from "@/context/DataProviderContext";
import { showSuccess, showError } from "@/utils/toast";
import {
  saveFile,
  generateBackupData,
  processImport,
  processEncryptedImport,
} from "@/utils/backupUtils";
import { encryptData } from "@/utils/crypto";
import PasswordDialog from "@/components/dialogs/PasswordDialog";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useLedger } from "@/contexts/LedgerContext";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

const DataManagementPage = () => {
  const dataProvider = useDataProvider();
  const navigate = useNavigate();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();
  const { handleClearAllFilters } = useTransactionFilters();
  const { refreshLedgers } = useLedger();

  // Data Management State
  const [isExportPasswordOpen, setIsExportPasswordOpen] = React.useState(false);
  const [isImportPasswordOpen, setIsImportPasswordOpen] = React.useState(false);
  // Reset / Demo Data State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] =
    React.useState(false);

  const [tempImportFile, setTempImportFile] = React.useState<string | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Export Logic ---
  const handleExportPlain = async () => {
    try {
      const filename = `budget_backup_${new Date().toISOString().split("T")[0]}.json`;
      const description = "Budget It Full Backup (All Ledgers)";

      const data = await generateBackupData(dataProvider);
      const jsonString = JSON.stringify(data, null, 2);

      const success = await saveFile(filename, jsonString, description);

      if (success) {
        showSuccess("File saved successfully!");
      } else {
        showSuccess("Export file download started.");
      }
    } catch (e: unknown) {
      const error = e as Error;
      if (error.message !== "Save cancelled by user") {
        showError(`Export failed: ${error.message}`);
      }
    }
  };

  const handleExportEncryptedParams = async (password: string) => {
    try {
      const data = await generateBackupData(dataProvider);
      const jsonString = JSON.stringify(data);
      const encrypted = await encryptData(jsonString, password);
      const filename = `budget_backup_enc_${new Date().toISOString().split("T")[0]}.lock`;

      const success = await saveFile(
        filename,
        encrypted,
        "Budget It Full Backup (Encrypted)",
      );

      if (success) {
        showSuccess("Encrypted file saved successfully!");
      }
    } catch (e: unknown) {
      const error = e as Error;
      if (error.message !== "Save cancelled by user") {
        showError(`Encryption failed: ${error.message}`);
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

      const result = await processImport(content, dataProvider);

      if (result.type === "success") {
        showSuccess("Data imported successfully!");
        window.location.reload();
      } else if (result.type === "encrypted") {
        setTempImportFile(result.content);
        setIsImportPasswordOpen(true);
      } else if (result.type === "error") {
        showError(result.message || "Import failed");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const handleImportEncryptedParams = async (password: string) => {
    if (!tempImportFile) return;
    const result = await processEncryptedImport(
      tempImportFile,
      password,
      dataProvider,
    );

    if (result.type === "success") {
      showSuccess("Encrypted data imported successfully!");
      setTempImportFile(null);
      window.location.reload();
    } else if (result.type === "error") {
      showError(result.message || "Import failed");
    }
  };

  const handleResetData = async () => {
    try {
      await dataProvider.clearAllData();
      // Refresh ledgers to ensure context is aware of the wipe
      await refreshLedgers();

      clearAllTransactions();
      handleClearAllFilters();

      // Clear non-filter persistent state if desired
      localStorage.removeItem("activeLedgerId");
      localStorage.removeItem("userLoggedOut");
      // filter_selectedAccounts is handled by handleClearAllFilters

      showSuccess("All application data has been reset.");

      navigate("/ledgers");
    } catch (error: unknown) {
      showError(`Reset failed: ${(error as Error).message}`);
    } finally {
      setIsResetConfirmOpen(false);
    }
  };

  const handleGenerateDemoData = async () => {
    try {
      await generateDiverseDemoData();
    } catch {
      // Ignore error during demo data generation
    } finally {
      setIsGenerateConfirmOpen(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            Data
          </h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
            Export, import, and schedule backups for your data.
          </p>
        </div>
      </div>

      {/* Manual Backup Section */}
      <ThemedCard className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
        <ThemedCardHeader>
          <ThemedCardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            Manual Backup & Restore
          </ThemedCardTitle>
          <ThemedCardDescription>
            Export your data to a local file immediately, or restore from a
            previous backup.
          </ThemedCardDescription>
        </ThemedCardHeader>
        <ThemedCardContent className="space-y-4">
          <Alert className="bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">
              Important
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Since this is a local-first app, if you clear your browser data,
              you will lose your records. Please export regular backups.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                onClick={handleExportPlain}
                variant="outline"
                className="bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40"
              >
                <FileJson className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button
                onClick={() => setIsExportPasswordOpen(true)}
                variant="outline"
                className="bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40"
              >
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

      {/* Scheduled Backups Section Moved to /backup */}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Reset Data Card */}
        <ThemedCard className="border-red-200/50 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10">
          <ThemedCardHeader>
            <ThemedCardTitle className="text-red-600 dark:text-red-400">
              Reset All Data
            </ThemedCardTitle>
            <ThemedCardDescription>
              Permanently delete all transaction, vendor, and account records.
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Button
              variant="destructive"
              onClick={() => setIsResetConfirmOpen(true)}
            >
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
              Generate diverse demo transactions. This will clear existing data
              first.
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Button
              onClick={() => setIsGenerateConfirmOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Generate Data
            </Button>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Dialogs */}
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
    </div>
  );
};

export default DataManagementPage;
