import * as React from 'react';
import { Transaction, Category, SubCategory } from '@/data/finance-data';
import { useCurrency } from './CurrencyContext';
import { Payee } from '@/components/AddEditPayeeDialog';
import { useUser } from './UserContext';
import { useQuery, useQueryClient, QueryObserverResult } from '@tanstack/react-query';
import { useDataProvider } from '@/context/DataProviderContext';
import { ScheduledTransaction } from '@/types/dataProvider';
import { v4 as uuidv4 } from 'uuid';

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface DemoDataProgress {
  stage: string;
  progress: number;
  totalStages: number;
}

interface TransactionsContextType {
  transactions: Transaction[];
  vendors: Payee[];
  accounts: Payee[];
  categories: Category[];
  accountCurrencyMap: Map<string, string>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id' | 'user_id' | 'is_scheduled_origin'> & { date: string; receivingAmount?: number; recurrenceFrequency?: string; recurrenceEndDate?: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transfer_id?: string) => void;
  deleteMultipleTransactions: (transactionsToDelete: TransactionToDelete[]) => void;
  clearAllTransactions: () => void;
  generateDiverseDemoData: () => void;
  refetchVendors: () => Promise<QueryObserverResult<Payee[], Error>>;
  refetchAccounts: () => Promise<QueryObserverResult<Payee[], Error>>;
  refetchCategories: () => Promise<QueryObserverResult<Category[], Error>>;

  refetchSubCategories: () => Promise<QueryObserverResult<SubCategory[], Error>>;
  invalidateAllData: () => Promise<void>;
  refetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>;
  demoDataProgress: DemoDataProgress | null;
  processScheduledTransactions: () => Promise<void>;
  isLoadingTransactions: boolean;
  isLoadingVendors: boolean;
  isLoadingAccounts: boolean;
  isLoadingCategories: boolean;
  isLoadingSubCategories: boolean;
  subCategories: SubCategory[]; // DB sub-categories
  allSubCategories: string[]; // Union of DB and used sub-categories
  scheduledTransactions: ScheduledTransaction[];
  isLoadingScheduledTransactions: boolean;
  addScheduledTransaction: (transaction: Omit<ScheduledTransaction, 'id' | 'created_at'>) => Promise<void>;
  updateScheduledTransaction: (transaction: ScheduledTransaction) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
  detectAndLinkTransfers: (batch?: Transaction[]) => Promise<number>;
}

export const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

const transformPayeeData = (data: any[]): Payee[] => {
  if (!data) return [];
  return data.map((item: any) => ({
    id: item.id, name: item.name, is_account: item.is_account, created_at: item.created_at,
    account_id: item.account_id, currency: item.currency, starting_balance: item.starting_balance,
    remarks: item.remarks, running_balance: item.running_balance, totalTransactions: item.total_transactions || 0,
    type: item.type, credit_limit: item.credit_limit,
  })).sort((a, b) => a.name.localeCompare(b.name));
};

const transformCategoryData = (data: any[]): Category[] => {
  if (!data) return [];
  return data.map((item: any) => ({
    id: item.id, name: item.name, user_id: item.user_id, created_at: item.created_at, totalTransactions: item.total_transactions || 0,
  })).sort((a, b) => a.name.localeCompare(b.name));
};

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { convertBetweenCurrencies: _convert } = useCurrency();
  const { user } = useUser();
  const [demoDataProgress, setDemoDataProgress] = React.useState<DemoDataProgress | null>(null);
  const dataProvider = useDataProvider();

  const convertBetweenCurrenciesRef = React.useRef(_convert);
  React.useEffect(() => {
    convertBetweenCurrenciesRef.current = _convert;
  }, [_convert]);



  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery<Transaction[], Error>({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await dataProvider.getTransactions(user.id);
    },
    enabled: !!user?.id, // && !isLoadingUser removed as user object is enough check
  });



  const { data: vendors = [], isLoading: isLoadingVendors, refetch: refetchVendors } = useQuery({
    queryKey: ['vendors', user?.id, transactions.length], // Depend on transactions to recalc counts
    queryFn: async () => {
      if (!user?.id) return [];
      const allVendors = await dataProvider.getAllVendors();
      // Filter for payees (not accounts)
      // Actually Supabase 'vendors' table contains both.
      // 'get_vendors_with_transaction_counts' returned only is_account=false usually?
      // Let's check logic: Vendors page shows payees. Accounts page shows accounts.

      const payees = allVendors.filter(v => !v.is_account);

      // Calculate counts
      // This is inefficient O(N*M) but fine for local.
      return payees.map(v => {
        const count = transactions.filter(t => t.vendor === v.name).length;
        return {
          ...v,
          total_transactions: count,
          // Supabase RPC returned created_at, etc.
          // Dexie returns what's stored.
        };
      });
    },
    enabled: !!user?.id,
    select: transformPayeeData,
  });

  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['accounts', user?.id, transactions],
    queryFn: async () => {
      if (!user?.id) return [];
      const allVendors = await dataProvider.getAllVendors();
      const accountVendors = allVendors.filter(v => v.is_account);

      // Fetch all accounts details to get starting balance
      const allAccountsDetails = await dataProvider.getAllAccounts();
      const accountMap = new Map(allAccountsDetails.map(a => [a.id, a]));

      // Map Name -> Account via the vendor list we just fetched!
      const nameToAccountMap = new Map<string, any>();
      allVendors.forEach(v => {
        if (v.is_account && v.account_id) {
          const acc = accountMap.get(v.account_id);
          if (acc) nameToAccountMap.set(v.name.trim().toLowerCase(), acc);
        }
      });
      allVendors.forEach(v => {
        if (v.is_account && v.account_id) {
          const acc = accountMap.get(v.account_id);
          if (acc) nameToAccountMap.set(v.name.trim().toLowerCase(), acc);
        }
      });

      return await Promise.all(accountVendors.map(async v => {
        // Get starting balance
        let accountDetails = v.account_id ? accountMap.get(v.account_id) : undefined;

        // Fallback: try looking up by name
        if (!accountDetails) {
          accountDetails = nameToAccountMap.get(v.name.trim().toLowerCase());
        }

        const startingBalance = accountDetails?.starting_balance || 0;
        const currency = accountDetails?.currency || await dataProvider.getAccountCurrency(v.name);
        const type = accountDetails?.type;
        const creditLimit = accountDetails?.credit_limit;

        // Calculate running balance: starting_balance + sum(transactions)
        // Normalize names for comparison
        const vNameNormalized = v.name.trim().toLowerCase();

        // Get today's date in YYYY-MM-DD format (local time)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const accountTransactions = transactions.filter(t =>
          (t.account || '').trim().toLowerCase() === vNameNormalized &&
          (t.date || '').substring(0, 10) <= todayStr
        );
        const totalTransactionAmount = accountTransactions.reduce((sum, t) => sum + t.amount, 0);

        const runningBalance = startingBalance + totalTransactionAmount;

        const count = accountTransactions.length + transactions.filter(t => t.vendor === v.name && t.account !== v.name).length;

        return {
          ...v,
          currency,
          total_transactions: count,
          starting_balance: startingBalance,
          running_balance: runningBalance,
          type: type,
          credit_limit: creditLimit,
        };
      }));
    },
    enabled: !!user?.id,
    select: transformPayeeData,
  });

  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories', user?.id, transactions.length],
    queryFn: async () => {
      if (!user?.id) return [];
      // ensure_default_categories... logic is missing in provider.
      // We can implement it in 'getUserCategories' of LocalDataProvider later if needed.

      const cats = await dataProvider.getUserCategories(user.id);
      return cats.map(c => ({
        ...c,
        total_transactions: transactions.filter(t => t.category === c.name).length
      }));
    },
    enabled: !!user?.id,
    select: transformCategoryData,
  });

  const { data: subCategories = [], isLoading: isLoadingSubCategories, refetch: refetchSubCategories } = useQuery<SubCategory[], Error>({
    queryKey: ['sub_categories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const subs = await dataProvider.getSubCategories(user.id);
      return subs;
    },
    enabled: !!user?.id,
  });

  const { data: scheduledTransactions = [], isLoading: isLoadingScheduledTransactions } = useQuery({
    queryKey: ['scheduledTransactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await dataProvider.getScheduledTransactions(user.id);
    },
    enabled: !!user?.id,
  });

  const accountCurrencyMap = React.useMemo(() => {
    const newMap = new Map<string, string>();
    accounts.forEach(account => {
      if (account.name && account.currency) {
        newMap.set(account.name, account.currency);
      }
    });
    return newMap;
  }, [accounts]);

  const invalidateAllData = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['vendors'] });
    await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
    await queryClient.invalidateQueries({ queryKey: ['subCategories'] });
    await queryClient.invalidateQueries({ queryKey: ['sub_categories'] });
    await queryClient.invalidateQueries({ queryKey: ['scheduledTransactions'] });
  }, [queryClient]);

  // Implement basic add/update/delete using DataProvider directly
  // replacing transactionsService
  const addTransaction = async (transaction: any) => {
    // Check if it's a transfer
    // In our app, a transfer is identified if the vendor name matches an account name
    const isTransfer = accounts.some(acc => acc.name === transaction.vendor);

    if (isTransfer) {
      const transferId = uuidv4();
      const userId = user?.id || 'local-user';

      // Source transaction
      const sourceTransaction = {
        ...transaction,
        transfer_id: transferId,
        user_id: userId,
        category: 'Transfer',
        date: new Date(transaction.date).toISOString(),
      };
      // Destructure receivingAmount as we don't store it in the source side amount field directly usually
      // but the dialog sends it.
      const { receivingAmount, ...cleanSource } = sourceTransaction;

      await dataProvider.addTransaction(cleanSource);

      // Destination transaction
      const destTransaction = {
        ...transaction,
        account: transaction.vendor, // Swap account and vendor
        vendor: transaction.account,
        amount: transaction.receivingAmount || -transaction.amount, // Use receiving amount (positive usually)
        transfer_id: transferId,
        user_id: userId,
        category: 'Transfer',
        date: new Date(transaction.date).toISOString(),
      };
      const { receivingAmount: _, ...cleanDest } = destTransaction;

      await dataProvider.addTransaction(cleanDest);
      await dataProvider.ensureCategoryExists('Transfer', userId);
    } else {
      await dataProvider.addTransaction(transaction);
    }

    await invalidateAllData();
  };
  const updateTransaction = async (transaction: any) => {
    await dataProvider.updateTransaction(transaction);
    await invalidateAllData();
  };
  const deleteTransaction = async (id: string, transfer_id?: string) => {
    if (transfer_id) {
      await dataProvider.deleteTransactionByTransferId(transfer_id);
    } else {
      await dataProvider.deleteTransaction(id);
    }
    await invalidateAllData();
  };
  const deleteMultipleTransactions = async (items: TransactionToDelete[]) => {
    for (const item of items) {
      if (item.transfer_id) await dataProvider.deleteTransactionByTransferId(item.transfer_id);
      else await dataProvider.deleteTransaction(item.id);
    }
    await invalidateAllData();
  };
  const clearAllTransactions = async () => {
    await dataProvider.clearAllData();
    await invalidateAllData();
  };

  const addScheduledTransaction = async (transaction: any) => {
    await dataProvider.addScheduledTransaction(transaction);
    await invalidateAllData();
  };

  const updateScheduledTransaction = async (transaction: any) => {
    await dataProvider.updateScheduledTransaction(transaction);
    await invalidateAllData();
  };

  const deleteScheduledTransaction = async (id: string) => {
    await dataProvider.deleteScheduledTransaction(id);
    await invalidateAllData();
  };

  const detectAndLinkTransfers = React.useCallback(async (batch?: Transaction[]) => {
    const listToScan = batch || transactions;
    if (listToScan.length < 2) return 0;

    const pairsLinked = [];
    const processedIds = new Set<string>();

    const normalizeDate = (d: string) => d.substring(0, 10);

    for (let i = 0; i < listToScan.length; i++) {
      const t1 = listToScan[i];
      if (t1.transfer_id || processedIds.has(t1.id)) continue;

      for (let j = i + 1; j < listToScan.length; j++) {
        const t2 = listToScan[j];
        if (t2.transfer_id || processedIds.has(t2.id)) continue;

        if (normalizeDate(t1.date) !== normalizeDate(t2.date)) continue;
        if (t1.currency !== t2.currency) continue;
        if (Math.abs(t1.amount + t2.amount) > 0.01) continue;
        if (t1.account === t2.account) continue;

        await dataProvider.linkTransactionsAsTransfer(t1.id, t2.id);
        pairsLinked.push([t1.id, t2.id]);
        processedIds.add(t1.id);
        processedIds.add(t2.id);
        break;
      }
    }

    if (pairsLinked.length > 0) {
      await invalidateAllData();
    }
    return pairsLinked.length;
  }, [transactions, dataProvider, invalidateAllData]);

  // Demo Data Generation
  const generateDiverseDemoData = async () => {
    try {
      setDemoDataProgress({ stage: 'Starting...', progress: 0, totalStages: 4 });
      const { generateDemoData } = await import('@/utils/demoDataGenerator');
      await generateDemoData(dataProvider, setDemoDataProgress);
      await invalidateAllData();
      await refetchTransactions();
      // Optional: Force a complete reload if context state isn't enough, but invalidate should work
    } catch (error) {
      console.error("Failed to generate demo data:", error);
    } finally {
      // Keep at 100 for a moment so dialog can close gracefully
      setDemoDataProgress({ stage: 'Complete', progress: 100, totalStages: 4 });
      setTimeout(() => setDemoDataProgress(null), 1000);
    }
  };

  const processScheduledTransactions = async () => { };

  // Auth state listener removed as we are local-first/no-auth

  // Auto-switch currency if on default (USD) and no USD accounts exist
  const hasCheckedCurrencyRef = React.useRef(false);
  const { selectedCurrency, setCurrency } = useCurrency();

  React.useEffect(() => {
    if (isLoadingAccounts || accounts.length === 0 || hasCheckedCurrencyRef.current) return;

    if (selectedCurrency === 'USD') {
      const accountCurrencies = new Set(accounts.map(a => a.currency).filter(Boolean));
      if (!accountCurrencies.has('USD') && accountCurrencies.size > 0) {
        // Find the most frequent currency or just the first one
        const firstCurrency = accounts[0].currency;
        if (firstCurrency && firstCurrency !== 'USD') {
          console.log(`Auto-switching currency from USD to ${firstCurrency} as no USD accounts found.`);
          setCurrency(firstCurrency);
        }
      }
    }
    hasCheckedCurrencyRef.current = true;
  }, [accounts, isLoadingAccounts, selectedCurrency, setCurrency]);

  const allSubCategories = React.useMemo(() => {
    const subs = new Set<string>();
    // Add used sub-categories from transactions
    transactions.forEach(t => {
      if (t.sub_category) subs.add(t.sub_category);
    });
    // Add defined sub-categories from DB
    subCategories.forEach(s => subs.add(s.name));
    return Array.from(subs).sort((a, b) => a.localeCompare(b));
  }, [transactions, subCategories]);

  // Sync Categories/Sub-categories from transactions to DB tables if missing
  // This helps recover data after a partial import or manual edit that bypassed entity creation.
  React.useEffect(() => {
    if (isLoadingTransactions || isLoadingCategories || isLoadingSubCategories || transactions.length === 0) return;

    const syncEntities = async () => {
      const userId = user?.id || 'local-user';

      for (const t of transactions) {
        if (t.category) {
          const catId = await dataProvider.ensureCategoryExists(t.category, userId);
          if (catId && t.sub_category) {
            await dataProvider.ensureSubCategoryExists(t.sub_category, catId, userId);
            // We don't strictly need to track if something was added here, 
            // but if we wanted to avoid unnecessary refetches, we could.
            // LocalDataProvider already checks for existence.
          }
        }
      }

      // Since it's hard to track if something was actually added without changing provider,
      // we'll just refetch if we think it's necessary based on some heuristic or just once.
      // For now, let's just refetch once after sync completes if we find it helpful.
      // Refetching might cause loops if not careful, so we use a ref.
    };

    const syncDoneKey = 'last_entity_sync_count';
    const lastCount = parseInt(localStorage.getItem(syncDoneKey) || '0', 10);
    if (transactions.length !== lastCount) {
      syncEntities().then(async () => {
        localStorage.setItem(syncDoneKey, transactions.length.toString());
        await detectAndLinkTransfers();
        refetchTransactions();
        refetchCategories();
        refetchSubCategories();
      });
    }
  }, [transactions, isLoadingTransactions, isLoadingCategories, isLoadingSubCategories, dataProvider, user?.id, refetchCategories, refetchSubCategories, detectAndLinkTransfers, refetchTransactions]);

  const value = React.useMemo(() => ({
    transactions, vendors, accounts, categories, accountCurrencyMap, allSubCategories, subCategories,
    addTransaction, updateTransaction, deleteTransaction, deleteMultipleTransactions, clearAllTransactions,
    generateDiverseDemoData, processScheduledTransactions,
    refetchVendors, refetchAccounts, refetchCategories, refetchSubCategories,
    invalidateAllData,
    refetchTransactions,
    demoDataProgress,
    isLoadingTransactions, isLoadingVendors, isLoadingAccounts, isLoadingCategories, isLoadingSubCategories,
    scheduledTransactions, isLoadingScheduledTransactions,
    addScheduledTransaction, updateScheduledTransaction, deleteScheduledTransaction,
    detectAndLinkTransfers,
  }), [
    transactions, vendors, accounts, categories, subCategories, accountCurrencyMap, allSubCategories,
    refetchVendors, refetchAccounts, refetchCategories, refetchSubCategories, invalidateAllData, refetchTransactions,
    demoDataProgress,
    isLoadingTransactions, isLoadingVendors, isLoadingAccounts, isLoadingCategories, isLoadingSubCategories,
    scheduledTransactions, isLoadingScheduledTransactions,
    addTransaction, updateTransaction, deleteTransaction, deleteMultipleTransactions, clearAllTransactions,
    generateDiverseDemoData, addScheduledTransaction, updateScheduledTransaction, deleteScheduledTransaction,
    detectAndLinkTransfers
  ]);

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = React.useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};