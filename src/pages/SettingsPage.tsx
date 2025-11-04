import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useToast } from '@/components/ui/use-toast';

const SettingsPage = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();
  const { toast } = useToast();

  const handleGenerateData = async () => {
    await generateDiverseDemoData();
    toast({
      title: "Demo Data Generated",
      description: "Your workspace has been populated with sample data.",
    });
  };

  const handleClearData = async () => {
    await clearAllTransactions();
    toast({
      title: "All Data Cleared",
      description: "All transaction and related data has been removed.",
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings.</p>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>Set your default currency for display and reporting.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-xs">
              <Select value={selectedCurrency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Actions for managing your application data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Demo Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Populate the application with sample data to explore its features.
              </p>
              <Button onClick={handleGenerateData}>Generate Demo Data</Button>
            </div>
            <div>
              <h3 className="font-medium mb-2">Clear Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Permanently delete all your transactions, accounts, and categories. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={handleClearData}>Clear All Data</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;