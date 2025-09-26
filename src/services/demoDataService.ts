import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { generateRandomTransactions } from '@/lib/demo-data';
import { Transaction, baseCategories, Category } from '@/data/finance-data';
import { supportedCurrencies as availableCurrencies } from '@/contexts/CurrencyContext';
import { QueryObserverResult } from '@tanstack/react-query';

interface DemoDataServiceProps {
  refetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>;
  invalidateAllData: () => Promise<void>;
  setDemoDataProgress: (progress: { stage: string; progress: number; totalStages: number } | null) => void;
  userId: string | undefined;
}

export const createDemoDataService = ({
  refetchTransactions,
  invalidateAllData,
  setDemoDataProgress,
  userId,
}: DemoDataServiceProps) => {

  const clearAllTransactions = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase.rpc('clear_all_app_data');
      if (error) throw error;
      await invalidateAllData();
      showSuccess("All application data has been reset.");
    } catch (error: any) {
      showError(`Failed to reset data: ${error.message}`);
    }
  };

  const generateDiverseDemoData = async () => {
    if (!userId) return;

    const totalStages = 6;
    const updateProgress = (stage: string, currentStage: number) => {
      setDemoDataProgress({ stage, progress: (currentStage / totalStages) * 100, totalStages });
    };

    try {
      updateProgress("Clearing existing data...", 1);
      await clearAllTransactions();

      updateProgress("Generating accounts...", 2);
      const accounts = [
        { name: 'Checking Account', currency: 'USD', starting_balance: 1500.00, remarks: 'Main checking' },
        { name: 'Savings Account', currency: 'USD', starting_balance: 12500.00, remarks: 'Emergency fund' },
        { name: 'Credit Card', currency: 'USD', starting_balance: -542.12, remarks: 'Rewards card' },
        { name: 'Investment Portfolio', currency: 'EUR', starting_balance: 50000.00, remarks: 'Long-term investments' },
        { name: 'Digital Wallet', currency: 'JPY', starting_balance: 10000, remarks: 'Online purchases' },
      ];
      const { error: accountError } = await supabase.rpc('batch_upsert_accounts', { p_accounts: accounts });
      if (accountError) throw accountError;

      updateProgress("Generating vendors...", 3);
      const vendors = [
        'SuperMart', 'TechGadgets Inc.', 'Corner Cafe', 'Power & Light Co.', 'City Water Dept.',
        'Global Internet', 'Rent-A-Home Properties', 'AutoGas Station', 'Cinema Plex', 'OnlineBooks.com',
        'Fashion Forward', 'FitLife Gym', 'MediCare Pharmacy', 'CommuteTrain', 'ByteFlow Software'
      ];
      const { error: vendorError } = await supabase.rpc('batch_upsert_vendors', { p_names: vendors });
      if (vendorError) throw vendorError;

      updateProgress("Generating categories...", 4);
      const categoriesToInsert = baseCategories.map(name => ({ user_id: userId, name }));
      const { error: categoryError } = await supabase.from('categories').insert(categoriesToInsert);
      if (categoryError) throw categoryError;

      updateProgress("Generating transactions...", 5);
      const generatedTransactions = generateRandomTransactions(
        100,
        accounts.map(a => a.name),
        vendors,
        baseCategories,
        availableCurrencies.map(c => c.code),
        userId
      );
      const { error: transactionError } = await supabase.from('transactions').insert(generatedTransactions);
      if (transactionError) throw transactionError;

      updateProgress("Finalizing...", 6);
      await invalidateAllData();
      showSuccess("Diverse demo data generated successfully!");

    } catch (error: any) {
      showError(`Failed to generate demo data: ${error.message}`);
    } finally {
      setDemoDataProgress(null);
    }
  };

  return {
    clearAllTransactions,
    generateDiverseDemoData,
  };
};