import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { showSuccess, showError } from "@/utils/toast"; // Assuming you have these toast utilities
import { RotateCcw, DatabaseZap, DollarSign } from "lucide-react";

const SettingsPage = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { clearAllTransactions, generateDiverseDemoData } = useTransactions();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = React.useState(false);

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    showSuccess(`Default currency set to ${value}.`);
  };

  const handleResetData = () => {
    clearAllTransactions();
    showSuccess("All transaction data has been reset.");
    setIsResetConfirmOpen(false);
  };

  const handleGenerateDemoData = () => {
    generateDiverseDemoData();
    showSuccess("Diverse demo data has been generated.");
    setIsGenerateConfirmOpen(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Currency Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Default Currency</CardTitle>
            <CardDescription>Select your preferred currency for display.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[180px]">
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

        {/* Reset Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Reset All Data</CardTitle>
            <CardDescription>Permanently delete all transaction records.</CardDescription>
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
              Generate diverse demo transactions for 6 accounts across 3 currencies.
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
        description="This action cannot be undone. All your transaction data will be permanently deleted."
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
    </div>
  );
};

export default SettingsPage;