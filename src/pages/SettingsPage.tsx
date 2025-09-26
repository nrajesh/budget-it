import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // Import Input component
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { showSuccess, showError } from "@/utils/toast";
import { RotateCcw, DatabaseZap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DemoDataProgressDialog } from "@/components/DemoDataProgressDialog";

const SettingsPage = () => {
  const { selectedCurrency, setCurrency, availableCurrencies, isLoadingCurrencies } = useCurrency();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = React.useState(false);
  const [isDemoDataProgressDialogOpen, setIsDemoDataProgressDialogOpen] = React.useState(false);
  const [futureMonths, setFutureMonths] = React.useState<number>(2);

  React.useEffect(() => {
    const savedMonths = localStorage.getItem('futureMonths');
    if (savedMonths) {
      setFutureMonths(parseInt(savedMonths, 10));
    }
  }, []);

  const handleCurrencyChange = async (value: string) => {
    await setCurrency(value);
    showSuccess(`Default currency set to ${value}.`);
  };

  const handleFutureMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setFutureMonths(value);
      localStorage.setItem('futureMonths', value.toString());
    }
  };

  const handleResetData = async () => {
    try {
      const { error } = await supabase.rpc('clear_all_app_data');
      if (error) throw error;
      
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

  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Currency Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Default Currency</CardTitle>
            <CardDescription>Select your preferred currency for display.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange} disabled={isLoadingCurrencies}>
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