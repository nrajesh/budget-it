import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DemoDataProgressDialog from '@/components/DemoDataProgressDialog';

const SettingsPage = () => {
  const { generateDiverseDemoData, clearAllTransactions, demoDataProgress } = useTransactions();
  const [isDemoDataDialogOpen, setIsDemoDataDialogOpen] = React.useState(false);

  const handleGenerateData = async () => {
    setIsDemoDataDialogOpen(true);
    await generateDiverseDemoData();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your application data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateData}>Generate Demo Data</Button>
          <Button variant="destructive" onClick={clearAllTransactions}>Clear All Data</Button>
        </CardContent>
      </Card>
      <DemoDataProgressDialog
        isOpen={isDemoDataDialogOpen}
        onOpenChange={setIsDemoDataDialogOpen}
      />
    </div>
  );
};

export default SettingsPage;