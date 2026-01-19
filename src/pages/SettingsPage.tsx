import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useTheme } from "@/contexts/ThemeContext";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { showSuccess, showError } from "@/utils/toast";
import { RotateCcw, DatabaseZap, Upload, FileLock, FileJson, AlertCircle } from "lucide-react";
import { DemoDataProgressDialog } from "@/components/DemoDataProgressDialog";
import { useDataProvider } from "@/context/DataProviderContext";
import { encryptData, decryptData } from "@/utils/crypto";
import PasswordDialog from "@/components/PasswordDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const SettingsPage = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();
  const { dashboardStyle, setDashboardStyle } = useTheme();
  const dataProvider = useDataProvider();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = React.useState(false);
  const [isDemoDataProgressDialogOpen, setIsDemoDataProgressDialogOpen] = React.useState(false);
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

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
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
      showSuccess("All application data has been reset.");
    } catch (error: any) {
      showError(`Failed to reset data: ${error.message}`);
    } finally {
      setIsResetConfirmOpen(false);
    }
  };

  const handleGenerateDemoData = async () => {
    setIsDemoDataProgressDialogOpen(true);
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

      const usedPicker = await saveFile(filename, jsonString, "Budget It JSON Backup");

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

      const usedPicker = await saveFile(filename, encrypted, "Encrypted Budget Backup");

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
    <div className="flex-1 space-y-4">
      <div className="flex flex-col gap-6 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage application preferences and data</p>
        </div>
      </div>

      {/* Consolidated Data Management Section */}
      <Card className="mt-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Data Management</CardTitle>
          <CardDescription>
            Export your data to a local file. The file will be saved to your browser's default download location (e.g., <b>Downloads</b>), or you may be asked to choose a specific folder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Since this is a local-first app, if you clear your browser data, you will lose your records.
              Please export regular backups.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button onClick={handleExportPlain} variant="outline">
                <FileJson className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button onClick={() => setIsExportPasswordOpen(true)} variant="outline">
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-6">
        {/* Currency Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Default Currency</CardTitle>
            <CardDescription>Select your preferred currency for display.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
          </CardContent>
        </Card>

        {/* Dashboard Style Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Style</CardTitle>
            <CardDescription>Choose your preferred dashboard layout.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={dashboardStyle} onValueChange={handleDashboardStyleChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="financial-pulse">Financial Pulse</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Future Transactions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Future Transactions</CardTitle>
            <CardDescription>
              Define how many months of future scheduled transactions to show.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={futureMonths}
                onChange={handleFutureMonthsChange}
                onBlur={() => showSuccess(`Future transaction view set to ${futureMonths} months.`)}
                min="0"
                className="w-[100px]"
              />
              <span className="text-sm text-muted-foreground">months</span>
            </div>
          </CardContent>
        </Card>

        {/* Reset Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Reset All Data</CardTitle>
            <CardDescription>Permanently delete all transaction, vendor, and account records.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setIsResetConfirmOpen(true)}>
              <DatabaseZap className="mr-2 h-4 w-4" />
              Reset All Data
            </Button>
          </CardContent>
        </Card>

        {/* Generate Demo Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Demo Data</CardTitle>
            <CardDescription>
              Generate diverse demo transactions. This will clear existing data first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsGenerateConfirmOpen(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Generate Data
            </Button>
          </CardContent>
        </Card>
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
        description="This action cannot be undone. All your transaction, vendor, and account data will be permanently deleted."
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

      <DemoDataProgressDialog
        isOpen={isDemoDataProgressDialogOpen}
        onOpenChange={setIsDemoDataProgressDialogOpen}
      />
    </div>
  );
};

export default SettingsPage;