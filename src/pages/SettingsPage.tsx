import * as React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";

import { useTheme, DashboardStyle } from "@/contexts/ThemeContext";
import { showSuccess } from "@/utils/toast";

import { ManageLedgerDialog } from "@/components/dialogs/ManageLedgerDialog";
import { useLedger } from "@/contexts/LedgerContext";
import { useSyncConfig } from "@/hooks/useSyncConfig";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, FolderOpen, ShieldAlert } from "lucide-react";
import { Label } from "@/components/ui/label";

const SettingsPage = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { dashboardStyle, setDashboardStyle } = useTheme();
  const { activeLedger, updateLedgerDetails } = useLedger();
  const syncConfig = useSyncConfig();

  const [isManageLedgerOpen, setIsManageLedgerOpen] = React.useState(false);
  const [isCreateLedgerOpen, setIsCreateLedgerOpen] = React.useState(false);
  const [futureMonths, setFutureMonths] = React.useState<number>(2);

  // Data Management State moved to DataManagementPage

  React.useEffect(() => {
    const savedMonths = localStorage.getItem("futureMonths");
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
      localStorage.setItem("futureMonths", value.toString());
    }
  };

  // ...

  const handleDashboardStyleChange = (value: string) => {
    setDashboardStyle(value as DashboardStyle);
    showSuccess(`Dashboard style set to ${value}.`);
  };

  // Data Management Logic moved to DataManagementPage

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            Ledger
          </h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
            Manage application preferences and data
          </p>
        </div>
      </div>

      {/* Data Management Section Moved to /data-management */}

      {/* Ledger Settings Card */}
      <ThemedCard>
        <ThemedCardHeader>
          <ThemedCardTitle>Ledger Settings</ThemedCardTitle>
          <ThemedCardDescription>
            Manage your current ledger details or create a new one.
          </ThemedCardDescription>
        </ThemedCardHeader>
        <ThemedCardContent className="flex gap-4">
          <Button
            onClick={() => setIsManageLedgerOpen(true)}
            className="bg-primary text-primary-foreground"
          >
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
            <ThemedCardDescription>
              Select your preferred currency for display.
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Select
              value={selectedCurrency}
              onValueChange={handleCurrencyChange}
            >
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
          </ThemedCardContent>
        </ThemedCard>

        {/* Dashboard Style Selection Card */}
        <ThemedCard>
          <ThemedCardHeader>
            <ThemedCardTitle>Dashboard Style</ThemedCardTitle>
            <ThemedCardDescription>
              Choose your preferred dashboard layout.
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Select
              value={dashboardStyle}
              onValueChange={handleDashboardStyleChange}
            >
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
                onBlur={() =>
                  showSuccess(
                    `Future transaction view set to ${futureMonths} months.`,
                  )
                }
                min="0"
                className="w-[100px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <span className="text-sm text-muted-foreground">months</span>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        {/* Sync Settings Card */}
        <ThemedCard className="md:col-span-2 lg:col-span-3">
          <ThemedCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <ThemedCardTitle>Cross-Device Continuity</ThemedCardTitle>
                <ThemedCardDescription>
                  Keep your data in sync across devices by choosing a shared
                  location.
                </ThemedCardDescription>
              </div>
              <Switch
                checked={syncConfig.config.autoSyncEnabled}
                onCheckedChange={(checked) =>
                  syncConfig.toggleAutoSync(checked)
                }
              />
            </div>
          </ThemedCardHeader>
          <ThemedCardContent>
            {syncConfig.config.autoSyncEnabled && (
              <div className="space-y-4">
                <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Recommendation</AlertTitle>
                  <AlertDescription>
                    To ensure seamless continuity, select a folder synced by a
                    cloud provider like iCloud, Google Drive, or Dropbox. Any
                    local folder works, but won't sync automatically to other
                    devices.
                    {!syncConfig.isElectron && !syncConfig.isCapacitor && (
                      <span className="block mt-2 font-medium">
                        Note: Due to browser privacy controls, you must create
                        this folder manually on your device before selecting it
                        here.
                      </span>
                    )}
                    {syncConfig.isCapacitor && (
                      <span className="block mt-2 font-medium">
                        Note: On mobile, synchronization occurs via the native
                        App Documents folder to ensure reliable offline
                        filesystem access.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 max-w-xl">
                  <Label>Sync Location</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        syncConfig.config.syncDirectoryHandle
                          ? "secondary"
                          : "outline"
                      }
                      onClick={async () => {
                        if (await syncConfig.selectFolder()) {
                          showSuccess("Sync folder location updated.");
                        }
                      }}
                      className="flex-1 justify-start font-normal"
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {syncConfig.config.syncDirectoryHandle
                          ? syncConfig.isElectron || syncConfig.isCapacitor
                            ? (syncConfig.config
                                .syncDirectoryHandle as unknown as string)
                            : (
                                syncConfig.config
                                  .syncDirectoryHandle as FileSystemDirectoryHandle
                              ).name
                          : "Select Folder"}
                      </span>
                    </Button>

                    {syncConfig.needsPermission && (
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (await syncConfig.requestPermission()) {
                            showSuccess("Access restored to sync folder.");
                          }
                        }}
                        className="animate-pulse"
                      >
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Grant Access
                      </Button>
                    )}
                  </div>
                  {syncConfig.needsPermission && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                      <ShieldAlert className="h-3 w-3" />
                      Browser permission required to access this folder.
                    </p>
                  )}
                </div>
              </div>
            )}
          </ThemedCardContent>
        </ThemedCard>
      </div>

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
    </div>
  );
};

export default SettingsPage;
