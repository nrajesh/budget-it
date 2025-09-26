import { Transaction, baseCategories, Category } from '@/data/finance-data';
import { QueryObserverResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast'; // Import showSuccess
import { ensurePayeeExists, ensureCategoryExists } from '@/integrations/supabase/utils';
import { Payee } from '@/components/AddEditPayeeDialog';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
}

interface DemoDataServiceProps {
  refetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>;
  invalidateAllData: () => Promise<void>;
  setDemoDataProgress: React.Dispatch<React.SetStateAction<{ stage: string; progress: number; totalStages: number } | null>>;
  userId: string | undefined;
  availableCurrencies: Currency[];
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

// Define a simpler type for the initial demo account data
interface DemoAccountInput {
  name: string;
  is_account: boolean;
  currency: string;
  starting_balance: number;
  remarks?: string;
}

export const createDemoDataService = ({
  refetchTransactions,
  invalidateAllData,
  setDemoDataProgress,
  userId,
  availableCurrencies,
  convertBetweenCurrencies,
}: DemoDataServiceProps) => {

  const generateDiverseDemoData = async () => {
    if (!userId) {
      showError("User not authenticated. Cannot generate demo data.");
      return;
    }

    setDemoDataProgress({ stage: "Clearing existing data...", progress: 0, totalStages: 6 });
    try {
      // Clear existing data
      const { error: clearError } = await supabase.rpc('clear_all_app_data');
      if (clearError) throw clearError;
      await invalidateAllData();
      setDemoDataProgress({ stage: "Data cleared. Generating accounts...", progress: 1, totalStages: 6 });

      // Generate Accounts
      const demoAccounts: DemoAccountInput[] = [ // Use the new interface here
        { name: "Checking Account", is_account: true, currency: "USD", starting_balance: 1500.00, remarks: "Main checking account" },
        { name: "Savings Account", is_account: true, currency: "USD", starting_balance: 5000.00, remarks: "Emergency fund" },
        { name: "Credit Card", is_account: true, currency: "USD", starting_balance: -300.00, remarks: "Monthly expenses" },
        { name: "Euro Account", is_account: true, currency: "EUR", starting_balance: 800.00, remarks: "Travel fund" },
      ];

      const accountUpsertPayload = demoAccounts.map(acc => ({
        name: acc.name,
        currency: acc.currency,
        starting_balance: acc.starting_balance,
        remarks: acc.remarks,
      }));

      const { error: accountUpsertError } = await supabase.rpc('batch_upsert_accounts', { p_accounts: accountUpsertPayload });
      if (accountUpsertError) throw accountUpsertError;

      // Fetch the newly created accounts to get their IDs and actual currencies
      const { data: fetchedAccounts, error: fetchAccountsError } = await supabase.rpc('get_accounts_with_transaction_counts');
      if (fetchAccountsError) throw fetchAccountsError;

      const accountMap = new Map<string, Payee>();
      fetchedAccounts.forEach((acc: any) => accountMap.set(acc.name, acc));

      setDemoDataProgress({ stage: "Accounts generated. Generating vendors...", progress: 2, totalStages: 6 });

      // Generate Vendors
      const demoVendors = [
        "SuperMart", "Coffee Shop", "Restaurant A", "Online Store", "Utility Bill",
        "Gym Membership", "Netflix", "Spotify", "Pharmacy", "Gas Station",
        "Book Store", "Travel Agency", "Rent Payment", "Salary", "Freelance Income"
      ];
      const { error: vendorUpsertError } = await supabase.rpc('batch_upsert_vendors', { p_names: demoVendors });
      if (vendorUpsertError) throw vendorUpsertError;
      setDemoDataProgress({ stage: "Vendors generated. Generating categories...", progress: 3, totalStages: 6 });

      // Ensure default categories for the user
      await supabase.rpc('ensure_default_categories_for_user', { p_user_id: userId });
      setDemoDataProgress({ stage: "Categories ensured. Generating transactions...", progress: 4, totalStages: 6 });

      // Generate Transactions
      const transactionsToInsert: Omit<Transaction, 'id' | 'created_at'>[] = [];
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const getRandomDate = (start: Date, end: Date) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      };

      const getRandomAmount = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

      const getRandomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

      const allCategories = [...baseCategories]; // Use base categories for demo data

      for (let i = 0; i < 100; i++) { // Generate 100 transactions
        const date = getRandomDate(oneYearAgo, today);
        const account = getRandomElement(demoAccounts);
        const vendor = getRandomElement(demoVendors);
        const category = getRandomElement(allCategories);
        let amount = getRandomAmount(5, 200);

        // Simulate income
        if (Math.random() < 0.1) { // 10% chance of income
          amount = getRandomAmount(500, 3000);
          transactionsToInsert.push({
            date: date.toISOString(),
            account: account.name,
            vendor: "Salary",
            category: "Income",
            amount: amount,
            remarks: "Monthly Salary",
            currency: account.currency || 'USD',
            user_id: userId,
            is_scheduled_origin: false,
          });
        } else if (Math.random() < 0.05) { // 5% chance of transfer
          const targetAccount = getRandomElement(demoAccounts.filter(a => a.name !== account.name));
          if (targetAccount) {
            const transferAmount = getRandomAmount(50, 500);
            const transfer_id = `transfer_demo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            const convertedAmount = convertBetweenCurrencies(transferAmount, account.currency || 'USD', targetAccount.currency || 'USD');

            transactionsToInsert.push({
              date: date.toISOString(),
              account: account.name,
              vendor: targetAccount.name,
              category: "Transfer",
              amount: -transferAmount,
              remarks: `Transfer to ${targetAccount.name}`,
              currency: account.currency || 'USD',
              user_id: userId,
              transfer_id,
              is_scheduled_origin: false,
            });
            transactionsToInsert.push({
              date: date.toISOString(),
              account: targetAccount.name,
              vendor: account.name,
              category: "Transfer",
              amount: convertedAmount,
              remarks: `Transfer from ${account.name}`,
              currency: targetAccount.currency || 'USD',
              user_id: userId,
              transfer_id,
              is_scheduled_origin: false,
            });
          }
        } else {
          transactionsToInsert.push({
            date: date.toISOString(),
            account: account.name,
            vendor: vendor,
            category: category,
            amount: -amount, // Most transactions are expenses
            remarks: `Demo transaction for ${category}`,
            currency: account.currency || 'USD',
            user_id: userId,
            is_scheduled_origin: false,
          });
        }
      }

      const { error: insertError } = await supabase.from('transactions').insert(transactionsToInsert);
      if (insertError) throw insertError;
      setDemoDataProgress({ stage: "Transactions generated. Generating scheduled transactions...", progress: 5, totalStages: 6 });

      // Generate Scheduled Transactions
      const scheduledTransactionsToInsert = [];
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      // Monthly Rent
      scheduledTransactionsToInsert.push({
        user_id: userId,
        date: nextMonth.toISOString(),
        account: "Checking Account",
        vendor: "Rent Payment",
        category: "Housing",
        amount: -1200.00,
        frequency: "1m",
        remarks: "Monthly rent payment",
        last_processed_date: today.toISOString(),
      });

      // Weekly Coffee
      scheduledTransactionsToInsert.push({
        user_id: userId,
        date: nextMonth.toISOString(),
        account: "Credit Card",
        vendor: "Coffee Shop",
        category: "Food & Dining",
        amount: -5.50,
        frequency: "1w",
        remarks: "Daily coffee",
        last_processed_date: today.toISOString(),
      });

      // Bi-weekly Salary
      scheduledTransactionsToInsert.push({
        user_id: userId,
        date: nextMonth.toISOString(),
        account: "Checking Account",
        vendor: "Salary",
        category: "Income",
        amount: 2500.00,
        frequency: "2w",
        remarks: "Bi-weekly paycheck",
        last_processed_date: today.toISOString(),
      });

      // Quarterly Subscription
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(today.getMonth() + 3);
      scheduledTransactionsToInsert.push({
        user_id: userId,
        date: threeMonthsLater.toISOString(),
        account: "Credit Card",
        vendor: "Netflix",
        category: "Entertainment",
        amount: -45.00,
        frequency: "3m",
        remarks: "Quarterly Netflix subscription",
        last_processed_date: today.toISOString(),
      });

      // Yearly Insurance
      const oneYearLater = new Date(today);
      oneYearLater.setFullYear(today.getFullYear() + 1);
      scheduledTransactionsToInsert.push({
        user_id: userId,
        date: oneYearLater.toISOString(),
        account: "Checking Account",
        vendor: "Insurance Co.",
        category: "Insurance",
        amount: -600.00,
        frequency: "1y",
        remarks: "Annual car insurance",
        last_processed_date: today.toISOString(),
      });

      const { error: scheduledInsertError } = await supabase.from('scheduled_transactions').insert(scheduledTransactionsToInsert);
      if (scheduledInsertError) throw scheduledInsertError;

      setDemoDataProgress({ stage: "Scheduled transactions generated. Finalizing...", progress: 6, totalStages: 6 });

      await invalidateAllData();
      showSuccess("Diverse demo data generated successfully!");
    } catch (error: any) {
      showError(`Failed to generate demo data: ${error.message}`);
      console.error("Demo data generation error:", error);
    } finally {
      setDemoDataProgress(null);
    }
  };

  const clearAllTransactions = async () => {
    if (!userId) {
      showError("User not authenticated. Cannot clear data.");
      return;
    }
    try {
      const { error } = await supabase.rpc('clear_all_app_data');
      if (error) throw error;
      await invalidateAllData();
      showSuccess("All application data has been reset.");
    } catch (error: any) {
      showError(`Failed to reset data: ${error.message}`);
    }
  };

  return {
    generateDiverseDemoData,
    clearAllTransactions,
  };
};