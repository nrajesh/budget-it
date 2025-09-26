import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Transaction, baseCategories, Category } from '@/data/finance-data';
import { currencies } from '@/data/currencies';
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
    if (!userId) {
      showError("You must be logged in to clear data.");
      return;
    }
    try {
      const { error } = await supabase.rpc('clear_all_app_data');
      if (error) throw error;
      await invalidateAllData();
      showSuccess("All your data has been cleared.");
    } catch (error: any) {
      showError(`Failed to clear data: ${error.message}`);
    }
  };

  const generateDiverseDemoData = async () => {
    if (!userId) {
      showError("You must be logged in to generate data.");
      return;
    }

    const totalStages = 5;
    setDemoDataProgress({ stage: 'Clearing existing data...', progress: 0, totalStages });

    try {
      // Stage 1: Clear existing data
      await clearAllTransactions();
      setDemoDataProgress({ stage: 'Creating accounts and vendors...', progress: 1, totalStages });

      // Stage 2: Create accounts and vendors
      const availableCurrencyCodes = currencies.map(c => c.code);
      const accountsToCreate = [
        { name: 'Checking Account', currency: 'USD', starting_balance: 5000, remarks: 'Main checking account' },
        { name: 'Savings Account', currency: 'USD', starting_balance: 15000, remarks: 'For long-term savings' },
        { name: 'Euro Wallet', currency: 'EUR', starting_balance: 2500, remarks: 'For European travel' },
        { name: 'Investment Portfolio', currency: 'JPY', starting_balance: 1000000, remarks: 'Stock investments' },
      ];
      await supabase.rpc('batch_upsert_accounts', { p_accounts: accountsToCreate });

      const vendorsToCreate = [
        'SuperMart', 'Edison Power', 'City Water', 'Gasoline Co.', 'Internet Provider',
        'Cell Phone Service', 'Landlord', 'Downtown Parking', 'Public Transport',
        'Favorite Cafe', 'Lunch Place', 'Fine Dining Restaurant', 'Movie Theater',
        'Streaming Service', 'Bookstore', 'Gym Membership', 'Pharmacy', 'Doctor\'s Office',
        'Clothing Store', 'Home Improvement', 'Paycheck', 'Freelance Client', 'Investment Dividend'
      ];
      await supabase.rpc('batch_upsert_vendors', { p_names: vendorsToCreate });
      setDemoDataProgress({ stage: 'Creating categories...', progress: 2, totalStages });

      // Stage 3: Create categories
      const categoriesToCreate = baseCategories.map(name => ({ user_id: userId, name }));
      const { error: catError } = await supabase.from('categories').insert(categoriesToCreate);
      if (catError) throw catError;
      setDemoDataProgress({ stage: 'Generating transactions...', progress: 3, totalStages });

      // Stage 4: Generate transactions
      const transactions: Omit<Transaction, 'id' | 'created_at'>[] = [];
      const today = new Date();

      for (let i = 0; i < 150; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - Math.floor(Math.random() * 365));

        const account = accountsToCreate[Math.floor(Math.random() * accountsToCreate.length)];
        const isIncome = Math.random() > 0.8;
        const category = isIncome
          ? 'Income'
          : baseCategories[Math.floor(Math.random() * baseCategories.length)];
        const vendor = isIncome
          ? ['Paycheck', 'Freelance Client', 'Investment Dividend'][Math.floor(Math.random() * 3)]
          : vendorsToCreate[Math.floor(Math.random() * vendorsToCreate.length)];
        const amount = isIncome
          ? Math.random() * 2000 + 500
          : -(Math.random() * 200 + 5);

        transactions.push({
          date: date.toISOString(),
          account: account.name,
          currency: account.currency,
          vendor,
          amount,
          category,
          remarks: `Random transaction #${i + 1}`,
          user_id: userId,
        });
      }
      const { error: transError } = await supabase.from('transactions').insert(transactions);
      if (transError) throw transError;
      setDemoDataProgress({ stage: 'Finalizing...', progress: 4, totalStages });

      // Stage 5: Finalize
      await invalidateAllData();
      showSuccess("Demo data generated successfully!");

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