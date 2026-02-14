import { useState, useRef } from "react";
import { useLedger } from "@/contexts/LedgerContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import {
  Building2,
  Home,
  Globe,
  Baby,
  Wallet,
  Landmark,
  Plus,
  Upload,
  RotateCcw,
  FileText,
} from "lucide-react";
import {
  ImportConfig,
  parseImportedData,
  MAPPABLE_CSV_HEADERS,
} from "@/utils/csvUtils";
import { ManageLedgerDialog } from "@/components/dialogs/ManageLedgerDialog";
import CSVMappingDialog from "@/components/transactions/CSVMappingDialog";
import { useDataProvider } from "@/context/DataProviderContext";
import { decryptData } from "@/utils/crypto";
import { showSuccess, showError } from "@/utils/toast";
import PasswordDialog from "@/components/dialogs/PasswordDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Trash2 } from "lucide-react";
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
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

const LedgerEntryPage = () => {
  const { ledgers, switchLedger, refreshLedgers, deleteLedger } = useLedger();
  const { generateDiverseDemoData } = useTransactions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);

  // Filter & Select State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLedgers, setSelectedLedgers] = useState<Set<string>>(
    new Set(),
  );
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [ledgerToDelete, setLedgerToDelete] = useState<string | null>(null); // For single delete
  const [isMassDelete, setIsMassDelete] = useState(false);

  // Import Logic State
  const dataProvider = useDataProvider();
  const [isImportPasswordOpen, setIsImportPasswordOpen] = useState(false);
  const [tempImportFile, setTempImportFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Advanced CSV Import State
  const [csvImportFile, setCsvImportFile] = useState<File | null>(null);
  const [isNewLedgerDialogOpen, setIsNewLedgerDialogOpen] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [newLedgerDetails, setNewLedgerDetails] = useState<{
    name: string;
    currency: string;
    icon?: string;
    short_name?: string;
  } | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSVClick = () => {
    csvFileInputRef.current?.click();
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvImportFile(file);
    // Open Ledger Details Dialog first
    setIsNewLedgerDialogOpen(true);
    e.target.value = ""; // Reset input
  };

  const handleLedgerDetailsConfirmed = (values: {
    name: string;
    currency: string;
    icon?: string;
    short_name?: string;
  }) => {
    setNewLedgerDetails(values);
    setIsNewLedgerDialogOpen(false);
    // Open Mapping Dialog next
    setIsMappingDialogOpen(true);
  };

  const handleMappingConfirmed = async (
    mappedData: Record<string, unknown>[],
    config: ImportConfig,
  ) => {
    if (!newLedgerDetails) return;

    try {
      // 1. Create New Ledger
      const newLedger = await dataProvider.addLedger({
        name: newLedgerDetails.name,
        currency: newLedgerDetails.currency,
        icon: newLedgerDetails.icon || "wallet",
        short_name: newLedgerDetails.short_name,
      });

      const ledgerId = newLedger.id;

      // 2. Parse and Import Transactions
      const transactions = parseImportedData(
        mappedData,
        config,
        newLedgerDetails.currency,
      );

      if (transactions.length === 0) {
        showError("No valid transactions found after parsing.");
        // We created an empty ledger. User might be confused.
        return;
      }

      // We need to ensure Accounts, Vendors, Categories exist.
      // Logic reused/adapted from previous implementation but using parsed transactions

      // Step A: Payees/Accounts
      const uniqueAccounts = [
        ...new Set(transactions.map((t) => t.account).filter(Boolean)),
      ];
      for (const accName of uniqueAccounts) {
        // Find currency for this account from data if possible?
        // parsed transactions have currency set to default or parsed.
        // We can find the first transaction for this account to get currency
        const t = transactions.find((tx) => tx.account === accName);
        const accCurrency = t?.currency || newLedgerDetails.currency;
        await dataProvider.ensurePayeeExists(accName, true, ledgerId, {
          currency: accCurrency,
        });
      }

      const uniqueVendors = [
        ...new Set(transactions.map((t) => t.vendor).filter(Boolean)),
      ];
      for (const vendName of uniqueVendors) {
        await dataProvider.ensurePayeeExists(vendName, false, ledgerId);
      }

      // Step B: Categories
      const uniqueCategories = [
        ...new Set(transactions.map((t) => t.category).filter(Boolean)),
      ];
      for (const catName of uniqueCategories) {
        await dataProvider.ensureCategoryExists(catName, ledgerId);
      }

      // Step C: Insert Transactions
      const transactionsToInsert = transactions.map((t) => ({
        user_id: ledgerId,
        date: t.date,
        account: t.account,
        vendor: t.vendor,
        category: t.category,
        amount: t.amount,
        remarks: t.remarks,
        currency: t.currency,
        transfer_id: t.transfer_id,
        is_scheduled_origin: t.is_scheduled_origin,
        recurrence_frequency: t.recurrence_frequency,
        recurrence_end_date: t.recurrence_end_date,
      }));

      await dataProvider.addMultipleTransactions(transactionsToInsert);

      showSuccess(
        `Imported ${transactionsToInsert.length} transactions into new ledger "${newLedgerDetails.name}".`,
      );
      await refreshLedgers();
    } catch (e) {
      console.error(e);
      showError("Failed to import CSV data.");
    } finally {
      setIsMappingDialogOpen(false);
      setCsvImportFile(null);
      setNewLedgerDetails(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        // Optimize: Parse once
        const parsed = JSON.parse(content);

        if (parsed.ciphertext && parsed.iv && parsed.salt) {
          // It's encrypted
          setTempImportFile(content);
          setIsImportPasswordOpen(true);
        } else {
          // Assume plain text
          await dataProvider.importData(parsed);
          showSuccess("Data imported successfully!");

          // Instant refresh instead of reload
          await refreshLedgers();
        }
      } catch {
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

      // Instant refresh instead of reload
      await refreshLedgers();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      showError(`Import failed: ${message}`);
    }
  };

  const handleSelectLedger = async (id: string) => {
    // Prevent navigation if clicking checkbox or delete button
    // Or if in "Selection Mode" (implied if items are selected)?
    // Requirement: "Give a mass select option". Let's say if we are clicking the card, we select it if selection mode is active?
    // For now, let's keep it simple: Card click = open, unless clicking specific controls.

    // Clear logout flag BEFORE switching
    localStorage.removeItem("userLoggedOut");
    await switchLedger(id);
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedLedgers);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedLedgers(newSelected);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLedgerToDelete(id);
    setIsMassDelete(false);
    setIsDeleteAlertOpen(true);
  };

  const handleMassDeleteClick = () => {
    setIsMassDelete(true);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (isMassDelete) {
        // Delete multiple
        for (const id of Array.from(selectedLedgers)) {
          await deleteLedger(id);
        }
        setSelectedLedgers(new Set());
        showSuccess(`Deleted ${selectedLedgers.size} ledgers.`);
      } else if (ledgerToDelete) {
        await deleteLedger(ledgerToDelete);
        showSuccess("Ledger deleted.");
      }
    } catch (error) {
      console.error(error); // Keep minimal error logging
      showError("Failed to delete ledger.");
    }
    setIsDeleteAlertOpen(false);
    setLedgerToDelete(null);
  };

  const handleGenerateDemoData = async () => {
    try {
      await generateDiverseDemoData();
    } catch {
      // Ignore error
    } finally {
      setIsGenerateConfirmOpen(false);
    }
  };

  const filteredLedgers = ledgers.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.short_name &&
        l.short_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "home":
        return <Home className="h-6 w-6" />;
      case "globe":
        return <Globe className="h-6 w-6" />;
      case "baby":
        return <Baby className="h-6 w-6" />;
      case "wallet":
        return <Wallet className="h-6 w-6" />;
      case "landmark":
        return <Landmark className="h-6 w-6" />;
      default:
        return <Building2 className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Budget It!" className="h-20 w-20 mx-auto" />
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
            Budget It!
          </h1>
          <p className="text-lg text-muted-foreground">
            Select a budget ledger to continue.
          </p>
        </div>

        {/* Search and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center sticky top-2 z-10 bg-gray-50/95 dark:bg-gray-900/95 p-2 rounded-lg backdrop-blur supports-[backdrop-filter]:bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ledgers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {selectedLedgers.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedLedgers.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleMassDeleteClick}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLedgers(new Set())}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div
          className={
            filteredLedgers.length === 0 && ledgers.length > 0
              ? "text-center text-muted-foreground py-10"
              : ledgers.length === 0
                ? "flex justify-center"
                : "grid grid-cols-1 md:grid-cols-2 gap-4"
          }
        >
          {filteredLedgers.length === 0 && ledgers.length > 0 && (
            <p>No ledgers match your search.</p>
          )}

          {filteredLedgers.map((ledger) => {
            const isSelected = selectedLedgers.has(ledger.id);
            return (
              <div key={ledger.id} className="relative group/card">
                {/* Selection Checkbox (Visible on hover or if selected) */}
                <div
                  className={`absolute top-3 right-3 z-20 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"}`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(c) =>
                      handleToggleSelect(ledger.id, c as boolean)
                    }
                    className="h-5 w-5 bg-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/50"
                  />
                </div>

                <ThemedCard
                  className={`cursor-pointer hover:border-primary/50 transition-all hover:bg-accent/50 group bg-card h-full ${isSelected ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => handleSelectLedger(ledger.id)}
                >
                  <ThemedCardHeader className="flex flex-row items-center gap-4 pb-2 space-y-0 pr-10">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
                      {getIcon(ledger.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <ThemedCardTitle className="text-xl">
                          {ledger.name}
                        </ThemedCardTitle>
                        {/* Delete Button (Visible on hover, if not selected mode maybe? Let's just put it next to title or separate) */}
                      </div>
                      <ThemedCardDescription className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded-sm inline-block mt-1">
                        {ledger.currency}
                      </ThemedCardDescription>
                    </div>

                    {/* Delete Individual Action */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute bottom-2 right-2 opacity-0 group-hover/card:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity h-10 w-10 p-2"
                      onClick={(e) => handleDeleteClick(ledger.id, e)}
                      title="Delete Ledger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </ThemedCardHeader>
                  <ThemedCardContent>
                    <p className="text-sm text-muted-foreground">
                      {ledger.short_name ? `(${ledger.short_name})` : ""}
                      <span className="block mt-1 text-xs opacity-70">
                        Last:{" "}
                        {ledger.last_accessed
                          ? new Date(ledger.last_accessed).toLocaleDateString()
                          : "Never"}
                      </span>
                    </p>
                  </ThemedCardContent>
                </ThemedCard>
              </div>
            );
          })}

          <ThemedCard
            className={`cursor-pointer border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center p-6 min-h-[140px] ${
              ledgers.length === 0 ? "max-w-md w-full" : ""
            }`}
            onClick={() => setIsCreateOpen(true)}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Plus className="h-8 w-8" />
              <span className="font-semibold">Create New Ledger</span>
            </div>
          </ThemedCard>
        </div>

        {/* Import Backup Controls */}
        {ledgers.length === 0 && (
          <>
            <div className="w-full flex flex-col justify-center items-center mt-4 gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json,.lock"
              />
              <input
                type="file"
                ref={csvFileInputRef}
                onChange={handleCSVFileChange}
                className="hidden"
                accept=".csv"
              />
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary"
                onClick={handleImportClick}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Backup (JSON / Encrypted)
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary"
                onClick={handleImportCSVClick}
              >
                <FileText className="mr-2 h-4 w-4" />
                Import Transactions CSV (Experimental)
              </Button>
            </div>
            <div className="w-full flex justify-center mt-2">
              <Button
                onClick={() => setIsGenerateConfirmOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Generate Data
              </Button>
            </div>
          </>
        )}

        {ledgers.length > 0 && (
          <>
            <div className="flex flex-col justify-center items-center pt-8 gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json,.lock"
              />
              <input
                type="file"
                ref={csvFileInputRef}
                onChange={handleCSVFileChange}
                className="hidden"
                accept=".csv"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                className="text-muted-foreground hover:text-primary w-full max-w-xs"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Backup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportCSVClick}
                className="text-muted-foreground hover:text-primary w-full max-w-xs"
              >
                <FileText className="mr-2 h-4 w-4" />
                Import Transactions CSV
              </Button>
            </div>
            <div className="flex justify-center mt-2">
              <Button
                onClick={() => setIsGenerateConfirmOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Generate Data
              </Button>
            </div>
          </>
        )}
      </div>

      <ManageLedgerDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* New Ledger Dialog for CSV Import */}
      <ManageLedgerDialog
        isOpen={isNewLedgerDialogOpen}
        onOpenChange={setIsNewLedgerDialogOpen}
        onConfirm={handleLedgerDetailsConfirmed}
        submitLabel="Next"
      />

      {/* CSV Mapping Dialog */}
      <CSVMappingDialog
        isOpen={isMappingDialogOpen}
        onClose={() => {
          setIsMappingDialogOpen(false);
          setCsvImportFile(null);
        }}
        file={csvImportFile}
        requiredHeaders={MAPPABLE_CSV_HEADERS}
        onConfirm={handleMappingConfirmed}
        isNewLedger={true}
      />

      <PasswordDialog
        isOpen={isImportPasswordOpen}
        onOpenChange={setIsImportPasswordOpen}
        onConfirm={handleImportEncryptedParams}
        title="Decrypt Backup"
        description="This file is encrypted. Please enter the password to restore your data."
        confirmText="Decrypt & Import"
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {isMassDelete
                ? `This will permanently delete ${selectedLedgers.size} ledgers and all their data (transactions, budgets, settings).`
                : "This will permanently delete this ledger and all its data (transactions, budgets, settings)."}
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmationDialog
        isOpen={isGenerateConfirmOpen}
        onOpenChange={setIsGenerateConfirmOpen}
        onConfirm={handleGenerateDemoData}
        title="Generate new demo data?"
        description="This will clear ALL existing data (ledgers, transactions, budgets) and generate new diverse demo data. This action cannot be undone."
        confirmText="Generate Data"
      />
    </div>
  );
};

export default LedgerEntryPage;
