import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { ensurePayeeExists, checkIfPayeeIsAccount, getAccountCurrency } from '@/integrations/supabase/utils';
import { Transaction, categories } from '@/data/finance-data';
import { availableCurrencies } from '@/contexts/CurrencyContext'; // Updated import to use direct export

interface DemoDataServiceProps {
  fetchTransactions: () => Promise<void>;
  refetchAllPayees: () => Promise<void>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setVendors: React.Dispatch<React.SetStateAction<any[]>>; // Use any[] for simplicity here, Payee[] in context
  setAccounts: React.Dispatch<React.SetStateAction<any[]>>; // Use any[] for simplicity here, Payee[] in context
}

// Helper function to generate sample transactions for a given month, account, and currency
const generateTransactions = async (
  monthOffset: number,
  count: number,
  existingAccountNames: string[],
  existingVendorNames: string[],
  accountCurrencyMap: Map<string, string>, // New parameter for pre-fetched currencies
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
    
    // Dynamically get the currency for the selected account from the map
    const currencyCode = accountCurrencyMap.get(accountName) || 'USD'; // Fallback to USD if currency not found

    let vendorName = existingVendorNames[Math.floor(Math.random() * existingVendorNames.length)];
    let categoryName = categories[Math.floor(Math.random() * categories.length)];
    let amountValue = parseFloat((Math.random() * 200 + 10).toFixed(2));

    if (isTransfer) {
      let destAccount = existingAccountNames[Math.floor(Math.random() * existingAccountNames.length)];
      while (destAccount === accountName) {
        destAccount = existingAccountNames[Math.floor(Math.random() * existingAccountNames.length)];
      }
      vendorName = destAccount;
      categoryName = 'Transfer';
      amountValue = Math.abs(amountValue);
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
      currency: currencyCode, // Use the fetched account currency
      vendor: vendorName,
      amount: amountValue,
      remarks: Math.random() > 0.7 ? `Sample remark ${i + 1}` : undefined,
      category: categoryName,
    };

    if (isTransfer) {
      const transfer_id = `transfer_${Date.now()}_${i}_${monthOffset}_${accountName.replace(/\s/g, '')}`;
      const debitTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
        transfer_id,
        amount: -Math.abs(baseTransactionDetails.amount),
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${baseTransactionDetails.remarks} (To ${baseTransactionDetails.vendor})` : `Transfer to ${baseTransactionDetails.vendor}`,
      };
      sampleTransactions.push(debitTransaction);

      const creditTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
        transfer_id,
        account: baseTransactionDetails.vendor,
        vendor: baseTransactionDetails.account,
        amount: Math.abs(baseTransactionDetails.amount),
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${(baseTransactionDetails.remarks as string).replace(`(To ${baseTransactionDetails.vendor})`, `(From ${baseTransactionDetails.account})`)}` : `Transfer from ${baseTransactionDetails.account}`,
      };
      sampleTransactions.push(creditTransaction);
    } else {
      const singleTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
      };
      sampleTransactions.push(singleTransaction);
    }
  }
  return sampleTransactions;
};

export const createDemoDataService = ({ fetchTransactions, refetchAllPayees, setTransactions, setVendors, setAccounts }: DemoDataServiceProps) => {

  const clearAllTransactions = async () => {
    try {
      const { error } = await supabase.rpc('clear_all_app_data'); // Use RPC for full data clear
      if (error) throw error;
      setTransactions([]);
      setVendors([]);
      setAccounts([]);
      showSuccess("All application data cleared successfully!");
      refetchAllPayees();
    } catch (error: any) {
      showError(`Failed to clear transactions: ${error.message}`);
    }
  };

  const generateDiverseDemoData = async () => {
    try {
      await clearAllTransactions(); // Clear existing data first

      const baseAccountNames = ["Checking Account", "Savings Account", "Credit Card", "Investment Account", "Travel Fund", "Emergency Fund"];
      const baseVendorNames = ["SuperMart", "Coffee Shop", "Online Store", "Utility Bill", "Rent Payment", "Gym Membership", "Restaurant A", "Book Store", "Pharmacy", "Gas Station"];
      
      // Step 1: Pre-create all accounts
      const createdAccountNames: string[] = [];
      for (const name of baseAccountNames) {
        const id = await ensurePayeeExists(name, true);
        if (id) createdAccountNames.push(name);
      }

      // Step 2: Pre-create all regular vendors
      const createdVendorNames: string[] = [];
      for (const name of baseVendorNames) {
        const id = await ensurePayeeExists(name, false);
        if (id) createdVendorNames.push(name);
      }

      // Step 3: Pre-fetch all account currencies into a map
      const accountCurrencyMap = new Map<string, string>();
      const { data: accountCurrencyData, error: currencyError } = await supabase
        .from('vendors')
        .select('name, accounts(currency)')
        .eq('is_account', true);

      if (currencyError) {
        console.error("Error fetching account currencies:", currencyError.message);
        showError("Failed to fetch account currencies for demo data generation.");
        return;
      }

      accountCurrencyData.forEach(item => {
        if (item.accounts && item.accounts.length > 0) {
          accountCurrencyMap.set(item.name, item.accounts[0].currency);
        }
      });

      // Step 4: Generate transactions using the pre-created names and currency map
      const demoData: Omit<Transaction, 'id' | 'created_at'>[] = [];
      demoData.push(...await generateTransactions(0, 300, createdAccountNames, createdVendorNames, accountCurrencyMap));
      demoData.push(...await generateTransactions(-1, 300, createdAccountNames, createdVendorNames, accountCurrencyMap));
      demoData.push(...await generateTransactions(-2, 300, createdAccountNames, createdVendorNames, accountCurrencyMap));

      // Step 5: Batch insert transactions
      if (demoData.length > 0) {
        const { error } = await supabase.from('transactions').insert(demoData);
        if (error) throw error;
        showSuccess("Diverse demo data generated successfully!");
      } else {
        showError("No demo data was generated to insert.");
      }
      
      fetchTransactions();
      refetchAllPayees();
    } catch (error: any) {
      showError(`Failed to generate demo data: ${error.message}`);
    }
  };

  return {
    clearAllTransactions,
    generateDiverseDemoData,
  };
};