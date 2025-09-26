import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { ensurePayeeExists, ensureCategoryExists } from '@/integrations/supabase/utils';
import { Transaction, baseCategories } from '@/data/finance-data';
import { availableCurrencies } from '@/contexts/CurrencyContext';
import { QueryObserverResult } from '@tanstack/react-query';

interface DemoDataServiceProps {
  refetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>;
  invalidateAllData: () => Promise<void>;
  setDemoDataProgress: React.Dispatch<React.SetStateAction<{ stage: string; progress: number; totalStages: number } | null>>;
  userId: string | undefined;
}

const generateTransactions = async (
  monthOffset: number,
  count: number,
  existingAccountNames: string[],
  existingVendorNames: string[],
  existingCategoryNames: string[],
  accountCurrencyMap: Map<string, string>,
  userId: string,
): Promise<Omit<Transaction, 'id' | 'created_at'>[]> => {
  const sampleTransactions: Omit<Transaction, 'id' | 'created_at'>[] = [];
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const endOfTargetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);

  for (let i = 0; i < count; i++) {
    const randomDay = Math.floor(Math.random() * (endOfTargetMonth.getDate() - targetMonth.getDate() + 1)) + targetMonth.getDate();
    const date = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), randomDay);

    const isTransfer = Math.random() < 0.2;
    const accountName = existingAccountNames[Math.floor(Math.random() * existingAccountNames.length)];
    const currencyCode = accountCurrencyMap.get(accountName) || 'USD';

    let vendorName = existingVendorNames[Math.floor(Math.random() * existingVendorNames.length)];
    let categoryName = existingCategoryNames[Math.floor(Math.random() * existingCategoryNames.length)];
    let amountValue = parseFloat((Math.random() * 200 + 10).toFixed(2));
    let destinationAccountCurrency: string = 'USD';

    if (isTransfer) {
      let destAccount = existingAccountNames[Math.floor(Math.random() * existingAccountNames.length)];
      while (destAccount === accountName) {
        destAccount = existingAccountNames[Math.floor(Math.random() * existingAccountNames.length)];
      }
      vendorName = destAccount;
      categoryName = 'Transfer';
      amountValue = Math.abs(amountValue);
      destinationAccountCurrency = accountCurrencyMap.get(destAccount) || 'USD';
    } else {
      if (Math.random() < 0.6 && categoryName !== 'Salary') {
        amountValue = -amountValue;
      } else if (categoryName === 'Salary') {
        amountValue = Math.abs(amountValue) * 5;
      }
    }

    const baseTransactionDetails: Omit<Transaction, 'id' | 'created_at' | 'transfer_id'> = {
      date: date.toISOString(),
      account: accountName,
      currency: currencyCode,
      vendor: vendorName,
      amount: amountValue,
      remarks: Math.random() > 0.7 ? `Sample remark ${i + 1}` : null,
      category: categoryName,
      user_id: userId,
      is_scheduled_origin: false,
      recurrence_id: null,
    };

    if (isTransfer) {
      const transfer_id = `transfer_${Date.now()}_${i}_${monthOffset}_${accountName.replace(/\s/g, '')}`;
      sampleTransactions.push({ ...baseTransactionDetails, transfer_id, amount: -Math.abs(baseTransactionDetails.amount), category: 'Transfer', remarks: `Transfer to ${baseTransactionDetails.vendor}` });
      sampleTransactions.push({ ...baseTransactionDetails, transfer_id, account: baseTransactionDetails.vendor, vendor: baseTransactionDetails.account, amount: Math.abs(baseTransactionDetails.amount), category: 'Transfer', remarks: `Transfer from ${baseTransactionDetails.account}`, currency: destinationAccountCurrency });
    } else {
      sampleTransactions.push(baseTransactionDetails);
    }
  }
  return sampleTransactions;
};

export const createDemoDataService = ({ refetchTransactions, invalidateAllData, setDemoDataProgress, userId }: DemoDataServiceProps) => {

  const clearAllTransactions = async () => {
    try {
      const { error } = await supabase.rpc('clear_all_app_data');
      if (error) throw error;
      showSuccess("All application data cleared successfully!");
      await invalidateAllData();
    } catch (error: any) {
      showError(`Failed to clear transactions: ${error.message}`);
      throw error;
    }
  };

  const generateDiverseDemoData = async () => {
    if (!userId) {
      showError("User not logged in. Cannot generate demo data.");
      setDemoDataProgress(null);
      throw new Error("User not logged in.");
    }

    const totalStages = 6;
    let currentStage = 0;

    try {
      setDemoDataProgress({ stage: "Clearing existing data...", progress: ++currentStage, totalStages });
      await clearAllTransactions();

      const baseAccountNames = ["Checking Account", "Savings Account", "Credit Card", "Investment Account", "Travel Fund", "Emergency Fund"];
      const baseVendorNames = ["SuperMart", "Coffee Shop", "Online Store", "Utility Bill", "Rent Payment", "Gym Membership", "Restaurant A", "Book Store", "Pharmacy", "Gas Station"];

      setDemoDataProgress({ stage: "Creating demo accounts...", progress: ++currentStage, totalStages });
      const createdAccountNames: string[] = [];
      for (const name of baseAccountNames) {
        if (await ensurePayeeExists(name, true)) createdAccountNames.push(name);
      }

      setDemoDataProgress({ stage: "Creating demo vendors...", progress: ++currentStage, totalStages });
      const createdVendorNames: string[] = [];
      for (const name of baseVendorNames) {
        if (await ensurePayeeExists(name, false)) createdVendorNames.push(name);
      }

      setDemoDataProgress({ stage: "Creating demo categories...", progress: ++currentStage, totalStages });
      const createdCategoryNames: string[] = [];
      for (const name of baseCategories) {
        if (await ensureCategoryExists(name, userId)) createdCategoryNames.push(name);
      }

      setDemoDataProgress({ stage: "Fetching account currencies...", progress: ++currentStage, totalStages });
      const { data: accountCurrencyData, error: currencyError } = await supabase.from('vendors').select('name, accounts(currency)').eq('is_account', true);
      if (currencyError) throw currencyError;
      const accountCurrencyMap = new Map<string, string>(accountCurrencyData.map(item => [item.name, item.accounts[0]?.currency || 'USD']));

      setDemoDataProgress({ stage: "Generating and inserting transactions...", progress: ++currentStage, totalStages });
      const demoData = (await Promise.all([
        generateTransactions(0, 300, createdAccountNames, createdVendorNames, createdCategoryNames, accountCurrencyMap, userId),
        generateTransactions(-1, 300, createdAccountNames, createdVendorNames, createdCategoryNames, accountCurrencyMap, userId),
        generateTransactions(-2, 300, createdAccountNames, createdVendorNames, createdCategoryNames, accountCurrencyMap, userId),
      ])).flat();

      if (demoData.length > 0) {
        const { error } = await supabase.from('transactions').insert(demoData);
        if (error) throw error;
        showSuccess("Diverse demo data generated successfully!");
      }

      await refetchTransactions();
      await invalidateAllData();
    } catch (error: any) {
      showError(`Failed to generate demo data: ${error.message}`);
      throw error;
    } finally {
      setDemoDataProgress(prev => prev ? { ...prev, progress: totalStages } : null);
      setTimeout(() => setDemoDataProgress(null), 500);
    }
  };

  return {
    clearAllTransactions,
    generateDiverseDemoData,
  };
};