import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from '@/contexts/CurrencyContext';
import { useUser } from '@/contexts/UserContext'; // Import useUser
import { currencies } from '@/data/currencies';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';

const SettingsPage = () => {
  const { selectedCurrency, setSelectedCurrency, isLoadingRates } = useCurrency();
  const { updateUserPreferences } = useUser(); // Get the update function
  const [futureMonths, setFutureMonths] = React.useState(() => {
    return localStorage.getItem('futureMonths') || '2';
  });

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    updateUserPreferences({ default_currency: newCurrency }); // Save to DB
  };

  const handleFutureMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFutureMonths(e.target.value);
  };

  const handleSaveFutureMonths = () => {
    const months = parseInt(futureMonths, 10);
    if (isNaN(months) || months < 1 || months > 24) {
      showError("Please enter a number between 1 and 24.");
      return;
    }
    localStorage.setItem('futureMonths', futureMonths);
    showSuccess("Setting saved successfully!");
  };

  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your application settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="currency" className="text-lg font-semibold">Default Currency</Label>
              <p className="text-sm text-muted-foreground">
                This is the default currency used for displaying financial data.
              </p>
            </div>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange} disabled={isLoadingRates}>
              <SelectTrigger className="w-full sm:w-[180px] mt-2 sm:mt-0">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="future-months" className="text-lg font-semibold">Future Transactions</Label>
              <p className="text-sm text-muted-foreground">
                Set how many months into the future to display scheduled transactions.
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <Input
                id="future-months"
                type="number"
                min="1"
                max="24"
                value={futureMonths}
                onChange={handleFutureMonthsChange}
                className="w-[100px]"
              />
              <Button onClick={handleSaveFutureMonths}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;