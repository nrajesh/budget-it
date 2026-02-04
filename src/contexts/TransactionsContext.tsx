import * as React from 'react';
import { Transaction, Category, SubCategory } from '@/data/finance-data';
import { startOfDay } from "date-fns";
import { db } from '@/lib/dexieDB';
import { useCurrency } from './CurrencyContext';
import { Payee } from '@/components/dialogs/AddEditPayeeDialog';
// import { useUser } from './UserContext'; // Replaced by useLedger
import { useLedger } from './LedgerContext';
import { useQuery, useQueryClient, QueryObserverResult } from '@tanstack/react-query';
import { useDataProvider } from '@/context/DataProviderContext';
import { ScheduledTransaction } from '@/types/dataProvider';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { calculateAccountStats } from '@/utils/accountUtils';
import { ToastAction } from '@/components/ui/toast'; // Kept for now if used elsewhere or remove if unused

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface OperationProgress {
  title?: string;
  description?: string;
  stage: string;
  progress: number;
  totalStages: number;
}

interface TransactionsContextType {
  /** All user transactions, sorted by date (descending by default) */
  transactions: Transaction[];
  /** Refetches the transaction list from the data provider */
  refetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>;

  /** List of all payees (vendors) that are NOT accounts */
  vendors: Payee[];
  /** List of all accounts (checking, savings, etc.) */
  accounts: Payee[];
  /** List of all unique categories */
  categories: Category[];
  /** Map of account names to their currency codes */
  accountCurrencyMap: Map<string, string>;

  /** Adds a new transaction and invalidates related queries */
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id' | 'user_id' | 'is_scheduled_origin'> & { date: string; receivingAmount?: number; recurrenceFrequency?: string; recurrenceEndDate?: string }) => void;
  /** Updates an existing transaction */
  updateTransaction: (transaction: Transaction) => void;
  /** Deletes a transaction by ID, or by transfer_id if provided */
  deleteTransaction: (transactionId: string, transfer_id?: string) => void;
  /** Bulk deletes multiple transactions */
  deleteMultipleTransactions: (transactionsToDelete: TransactionToDelete[]) => void;
  /** Wipes ALL data for the user */
  clearAllTransactions: () => void;
  /** Generates random demo data for testing */
  generateDiverseDemoData: () => void;

  refetchVendors: () => Promise<QueryObserverResult<Payee[], Error>>;
  refetchAccounts: () => Promise<QueryObserverResult<Payee[], Error>>;
  refetchCategories: () => Promise<QueryObserverResult<Category[], Error>>;
  refetchSubCategories: () => Promise<QueryObserverResult<SubCategory[], Error>>;

  /** Invalidates all major query keys to force data refresh */
  invalidateAllData: () => Promise<void>;

  /** Checks for due scheduled transactions and creates real transactions from them */
  processScheduledTransactions: () => Promise<void>;

  /** Current progress of a long-running operation (like import or demo generation) */
  operationProgress: OperationProgress | null;
  setOperationProgress: (progress: OperationProgress | null) => void;

  isLoadingTransactions: boolean;
  isLoadingVendors: boolean;
  isLoadingAccounts: boolean;
  isLoadingCategories: boolean;
  isLoadingSubCategories: boolean;

  /** List of defined sub-categories */
  subCategories: SubCategory[];
  /** Union of defined sub-categories and those found in transactions */
  allSubCategories: string[];

  scheduledTransactions: ScheduledTransaction[];
  isLoadingScheduledTransactions: boolean;
  refetchScheduledTransactions: () => Promise<QueryObserverResult<ScheduledTransaction[], Error>>;

  addScheduledTransaction: (transaction: Omit<ScheduledTransaction, 'id' | 'created_at'>) => Promise<void>;
  updateScheduledTransaction: (transaction: ScheduledTransaction) => Promise<void>;
  unlinkScheduledTransaction: (transferId: string) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
  deleteMultipleScheduledTransactions: (ids: string[]) => Promise<void>;

  /** Scans for potential transfers and links them */
  detectAndLinkTransfers: (batch?: Transaction[]) => Promise<number>;
  /** Unlinks a transfer pair using the transfer ID */
  unlinkTransaction: (transferId: string) => Promise<void>;
  /** Manually links two transactions as a transfer */
  linkTransactions: (id1: string, id2: string) => Promise<void>;

  /** Soft delete management for other entities */
  deleteBudget: (id: string) => void;
  deleteEntity: (type: 'vendor' | 'account' | 'category', ids: string[]) => void;
  hiddenBudgetIds: Set<string>;
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
  // const { user } = useUser();
  const { activeLedger, refreshLedgers, switchLedger } = useLedger();
  const ledgerId = activeLedger?.id || '';

  const [operationProgress, setOperationProgress] = React.useState<OperationProgress | null>(null);
  const dataProvider = useDataProvider();

  const convertBetweenCurrenciesRef = React.useRef(_convert);
  React.useEffect(() => {
    convertBetweenCurrenciesRef.current = _convert;
  }, [_convert]);



  const { toast, dismiss } = useToast();
  const lastToastIdRef = React.useRef<string | null>(null);
  const { data: rawTransactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery<Transaction[], Error>({
    queryKey: ['transactions', ledgerId],
    queryFn: async () => {
      if (!ledgerId) return [];
      const txs = await dataProvider.getTransactions(ledgerId);

      return txs;
    },
    enabled: !!ledgerId, // Only run if ledger is active
  });

  const { data: rawScheduledTransactions = [], isLoading: isLoadingScheduledTransactions, refetch: refetchScheduledTransactions } = useQuery({
    queryKey: ['scheduledTransactions', ledgerId],
    queryFn: async () => {
      if (!ledgerId) return [];
      return await dataProvider.getScheduledTransactions(ledgerId);
    },
    enabled: !!ledgerId,
  });

  // Undo System State
  const [hiddenTransactionIds, setHiddenTransactionIds] = React.useState<Set<string>>(new Set());
  const [hiddenScheduledIds, setHiddenScheduledIds] = React.useState<Set<string>>(new Set());
  const [hiddenBudgetIds, setHiddenBudgetIds] = React.useState<Set<string>>(new Set());
  const [hiddenEntityIds, setHiddenEntityIds] = React.useState<Map<string, Set<string>>>(new Map()); // Type -> Set<ID>

  const undoStackRef = React.useRef<{
    id: string; // Action ID
    type: 'DELETE_TRANSACTION' | 'DELETE_SCHEDULE' | 'DELETE_BUDGET' | 'DELETE_ENTITY';
    payload: {
      ids: string[];
      transferIds?: string[];
      entityType?: string; // For generic entities
    };
    timeoutId: NodeJS.Timeout;
  }[]>([]);

  // Derived transactions list (hiding soft-deleted items)
  const transactions = React.useMemo(() => {
    if (hiddenTransactionIds.size === 0) return rawTransactions;
    return rawTransactions.filter(t => !hiddenTransactionIds.has(t.id));
  }, [rawTransactions, hiddenTransactionIds]);

  const scheduledTransactions = React.useMemo(() => {
    if (hiddenScheduledIds.size === 0) return rawScheduledTransactions;
    return rawScheduledTransactions.filter(t => !hiddenScheduledIds.has(t.id));
  }, [rawScheduledTransactions, hiddenScheduledIds]);



  // Undo Function
  const undoLastAction = React.useCallback(() => {
    if (lastToastIdRef.current) {
      dismiss(lastToastIdRef.current);
      lastToastIdRef.current = null;
    }

    const lastAction = undoStackRef.current.pop();
    if (!lastAction) return;

    clearTimeout(lastAction.timeoutId);

    if (lastAction.type === 'DELETE_TRANSACTION') {
      setHiddenTransactionIds(prev => {
        const next = new Set(prev);
        lastAction.payload.ids.forEach(id => next.delete(id));
        return next;
      });
    } else if (lastAction.type === 'DELETE_SCHEDULE') {
      setHiddenScheduledIds(prev => {
        const next = new Set(prev);
        lastAction.payload.ids.forEach(id => next.delete(id));
        return next;
      });
    } else if (lastAction.type === 'DELETE_BUDGET') {
      setHiddenBudgetIds(prev => {
        const next = new Set(prev);
        lastAction.payload.ids.forEach(id => next.delete(id));
        return next;
      });
    } else if (lastAction.type === 'DELETE_ENTITY') {
      const type = lastAction.payload.entityType;
      if (type) {
        setHiddenEntityIds(prev => {
          const next = new Map(prev);
          const currentSet = new Set(next.get(type as any) || []);
          lastAction.payload.ids.forEach(id => currentSet.delete(id));
          next.set(type as any, currentSet);
          return next;
        });
      }
    }
  }, [dismiss]);

  // Keyboard Shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoLastAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastAction]);

  // ... (transactions query above)

  const { data: vendors = [], isLoading: isLoadingVendors, refetch: refetchVendors } = useQuery({
    queryKey: ['vendors', ledgerId, transactions.length],
    queryFn: async () => {
      // Local or Auth logic
      if (!ledgerId) return [];

      // dataProvider.getAllVendors() might return ALL if it ignores ID (LocalDataProvider does).
      // But if we wanted per-user:
      // const allVendors = await dataProvider.getAllVendors(userId); 
      // LocalDataProvider.getAllVendors() takes 0 args. It returns all.
      // So filtering should happen here or provider should accept ID.
      // For now, let's assume it returns all and we filter in memory or rely on single-user local DB.
      // LocalDataProvider.getAllVendors() takes 0 args. It returns all.
      // So filtering should happen here or provider should accept ID.
      // For now, let's assume it returns all and we filter in memory or rely on single-user local DB.
      const allVendors = await dataProvider.getAllVendors(ledgerId);

      // Filter for payees (is_account=false usually for "Vendors" list, but we return all Payees here?)
      // transformPayeeData handles shaping.
      // Let's return all for now as context provides 'vendors' and 'accounts'.

      const payees = allVendors.filter(v => !v.is_account);

      return payees.map(v => {
        const count = transactions.filter(t => t.vendor === v.name).length;
        return {
          ...v,
          total_transactions: count
        };
      });
    },
    enabled: true,
    select: transformPayeeData,
  });

  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['accounts', ledgerId, transactions], // Depend on transactions for balance calc
    queryFn: async () => {
      if (!ledgerId) return [];
      const allVendors = await dataProvider.getAllVendors(ledgerId);
      const accountVendors = allVendors.filter(v => v.is_account);
      const allAccountsDetails = await dataProvider.getAllAccounts(ledgerId);
      const accountMap = new Map(allAccountsDetails.map(a => [a.id, a]));

      const nameToAccountMap = new Map<string, any>();
      allVendors.forEach(v => {
        if (v.is_account && v.account_id) {
          const acc = accountMap.get(v.account_id);
          if (acc) nameToAccountMap.set(v.name.trim().toLowerCase(), acc);
        }
      });

      // Optimized: Pre-calculate balances and counts in a single pass
      const { balances, sourceCounts, vendorCounts } = calculateAccountStats(transactions);

      return await Promise.all(accountVendors.map(async v => {
        let accountDetails = v.account_id ? accountMap.get(v.account_id) : undefined;
        if (!accountDetails) {
          accountDetails = nameToAccountMap.get(v.name.trim().toLowerCase());
        }

        const startingBalance = accountDetails?.starting_balance || 0;
        const currency = accountDetails?.currency || await dataProvider.getAccountCurrency(v.name, ledgerId);
        const type = accountDetails?.type;
        const creditLimit = accountDetails?.credit_limit;

        const vNameNormalized = v.name.trim().toLowerCase();

        const totalTransactionAmount = balances.get(vNameNormalized) || 0;
        const runningBalance = startingBalance + totalTransactionAmount;

        const sourceCount = sourceCounts.get(vNameNormalized) || 0;
        const vendorCount = vendorCounts.get(v.name) || 0;
        const count = sourceCount + vendorCount;

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
    enabled: true,
    select: transformPayeeData,
  });

  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories', ledgerId, transactions.length],
    queryFn: async () => {
      if (!ledgerId) return [];
      const cats = await dataProvider.getUserCategories(ledgerId);
      return cats.map(c => ({
        ...c,
        total_transactions: transactions.filter(t => t.category === c.name).length
      }));
    },
    enabled: true,
    select: transformCategoryData,
  });



  const { data: subCategories = [], isLoading: isLoadingSubCategories, refetch: refetchSubCategories } = useQuery<SubCategory[], Error>({
    queryKey: ['sub_categories', ledgerId],
    queryFn: async () => {
      if (!ledgerId) return [];
      return await dataProvider.getSubCategories(ledgerId);
    },
    enabled: true,
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
    await refetchScheduledTransactions();
  }, [queryClient, refetchScheduledTransactions]);


  // ... (existing queries)

  // Fading Undo Link Component
  const FadingUndo: React.FC<{ onUndo: () => void }> = ({ onUndo }) => {
    const [opacity, setOpacity] = React.useState(1);

    React.useEffect(() => {
      // Start fading immediately to 0 over 7 seconds
      // We use a small timeout to ensure the initial render happens at opacity 1
      const timer = setTimeout(() => setOpacity(0), 50);
      return () => clearTimeout(timer);
    }, []);

    return (
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUndo();
        }}
        style={{
          transition: 'opacity 7000ms linear',
          opacity: opacity,
          cursor: 'pointer',
          textDecoration: 'underline',
          marginLeft: '8px',
          fontWeight: 600,
          color: '#3b82f6', // blue-500
        }}
        className="hover:underline"
      >
        Undo
      </span>
    );
  };

  // Helper for Undo Toasts
  const showUndoToast = (count: number, itemLabel: string) => {
    const { id } = toast({
      title: "Deleted",
      description: (
        <div className="flex items-center">
          <span>{count} {itemLabel}{count > 1 ? 's' : ''} deleted.</span>
          <FadingUndo onUndo={undoLastAction} />
        </div>
      ),
      duration: 7000,
    });
    lastToastIdRef.current = id;
  }

  // Implement basic add/update/delete using DataProvider directly
  // replacing transactionsService
  const addTransaction = async (transaction: any) => {
    // Check if it's a transfer
    // In our app, a transfer is identified if the vendor name matches an account name
    const isTransfer = accounts.some(acc => acc.name === transaction.vendor);
    const userId = ledgerId;

    if (isTransfer) {
      const transferId = uuidv4();

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
      await dataProvider.addTransaction({
        ...transaction,
        user_id: userId,
      });
    }

    await invalidateAllData();
  };
  const updateTransaction = async (transaction: any) => {
    // 1. Update the primary transaction
    await dataProvider.updateTransaction(transaction);

    // 2. Check for transfer pair to sync updates
    if (transaction.transfer_id) {
      const pair = transactions.find(t => t.transfer_id === transaction.transfer_id && t.id !== transaction.id);
      if (pair) {
        // Calculate pair amount
        // If receivingAmount is specified (cross-currency or explicit), use its magnitude
        // forcing the sign to be opposite of the primary transaction
        const magnitude = transaction.receivingAmount
          ? Math.abs(transaction.receivingAmount)
          : Math.abs(transaction.amount);

        const pairAmount = (transaction.amount < 0) ? magnitude : -magnitude;

        const pairUpdate = {
          ...pair,
          date: transaction.date,
          // Sync category if it's transfer, usually yes
          category: transaction.category,
          sub_category: transaction.sub_category,
          // Swap account and vendor
          account: transaction.vendor,
          vendor: transaction.account,
          amount: pairAmount,
          remarks: transaction.remarks,
          recurrence_frequency: transaction.recurrence_frequency,
          recurrence_end_date: transaction.recurrence_end_date,
        };
        await dataProvider.updateTransaction(pairUpdate);
      }
    }

    await invalidateAllData();
  };
  const deleteTransaction = async (id: string, transfer_id?: string) => {
    const idsToDelete: string[] = [];
    if (transfer_id) {
      // Find all transactions with this transfer_id
      const linked = transactions.filter(t => t.transfer_id === transfer_id);
      linked.forEach(t => idsToDelete.push(t.id));
    } else {
      idsToDelete.push(id);
    }

    // execute soft delete
    await deleteMultipleTransactions(idsToDelete.map(i => ({ id: i })));
  };
  const deleteMultipleTransactions = async (items: { id: string, transfer_id?: string, is_projected?: boolean, recurrence_id?: string, date?: string }[]) => {
    // Separate real and projected items
    const realItems = [];
    const projectedItems = [];

    for (const item of items) {
      if (item.is_projected || item.id.startsWith('proj_')) {
        projectedItems.push(item);
      } else {
        realItems.push(item);
      }
    }

    // 1. Handle Real Transactions (Soft Delete)
    if (realItems.length > 0) {
      const idsToDelete = new Set<string>();

      // Resolve all IDs to delete (handling transfers)
      realItems.forEach(item => {
        if (item.transfer_id) {
          transactions.filter(t => t.transfer_id === item.transfer_id).forEach(t => idsToDelete.add(t.id));
        } else {
          idsToDelete.add(item.id);
        }
      });

      const finalIds = Array.from(idsToDelete);
      if (finalIds.length === 0) return;

      // 1. Soft Delete: Hide immediately
      setHiddenTransactionIds(prev => {
        const next = new Set(prev);
        finalIds.forEach(id => next.add(id));
        return next;
      });

      // 2. Schedule Permanent Delete
      const timeoutId = setTimeout(async () => {
        // Perform actual delete
        if (typeof dataProvider.deleteMultipleTransactions === 'function') {
          await dataProvider.deleteMultipleTransactions(finalIds);
        } else {
          for (const id of finalIds) {
            await dataProvider.deleteTransaction(id);
          }
        }

        // Clean up stack reference for this action (optional optimization)
        undoStackRef.current = undoStackRef.current.filter(a => a.timeoutId !== timeoutId);

        // Clean up hidden IDs list (optional, but good for memory if refetch happens)
        // Actually, we must invalidate data now so the refetch happens and they are gone from 'rawTransactions'
        await invalidateAllData();
        setHiddenTransactionIds(prev => {
          const next = new Set(prev);
          finalIds.forEach(id => next.delete(id));
          return next;
        });

      }, 7000); // 7 seconds

      // 3. Push to Undo Stack
      undoStackRef.current.push({
        id: uuidv4(),
        type: 'DELETE_TRANSACTION',
        payload: { ids: finalIds },
        timeoutId
      });

      // 4. Show Toast
      showUndoToast(finalIds.length, "transaction");
    }

    // 2. Skip Projected Transactions (Add to ignored_dates)
    if (projectedItems.length > 0) {
      // Group by recurrence_id to minimize updates
      const skipMap = new Map<string, string[]>(); // recurrence_id -> dates[]

      for (const item of projectedItems) {
        if (item.recurrence_id && item.date) {
          const dates = skipMap.get(item.recurrence_id) || [];
          // Normalize date to YYYY-MM-DD or keep ISO depending on comparison logic. 
          // Usually projected items have full ISO. Let's store full ISO but comparison usually is by day.
          // Let's assume strict equality for now or normalize in provider. 
          dates.push(item.date);
          skipMap.set(item.recurrence_id, dates);
        }
      }

      for (const [recurrenceId, datesToSkip] of skipMap.entries()) {
        // We need to fetch the schedule first to get existing ignored_dates
        // We could add a method `addExceptionDate` to provider but fetching is safer for now.
        // Assuming we can find it in `scheduledTransactions` context state? 
        // Yes, `scheduledTransactions` is in scope.
        const schedule = scheduledTransactions.find(s => s.id === recurrenceId);
        if (schedule) {
          const currentIgnored = schedule.ignored_dates || [];
          const newIgnored = [...currentIgnored, ...datesToSkip];
          // Update
          await dataProvider.updateScheduledTransaction({
            ...schedule,
            ignored_dates: newIgnored
          });
        }
      }
    }

    await invalidateAllData();
  };
  const clearAllTransactions = async () => {
    await dataProvider.clearAllData();
    await invalidateAllData();
  };

  const addScheduledTransaction = async (transaction: any) => {
    const userId = ledgerId;

    // Check for transfer
    const isTransfer = accounts.some(acc => acc.name === transaction.vendor);

    if (isTransfer) {
      const transferId = uuidv4();

      // Source
      const source = {
        ...transaction,
        transfer_id: transferId,
        user_id: userId,
        category: 'Transfer',
        // Ensure date format or other fields are consistent
      };

      await dataProvider.addScheduledTransaction(source);

      // Destination
      const dest = {
        ...transaction,
        account: transaction.vendor,
        vendor: transaction.account,
        amount: -transaction.amount, // Negate amount
        transfer_id: transferId,
        user_id: userId,
        category: 'Transfer',
      };

      await dataProvider.addScheduledTransaction(dest);
    } else {
      await dataProvider.addScheduledTransaction({
        ...transaction,
        user_id: userId
      });
    }

    await invalidateAllData();
  };

  const unlinkScheduledTransaction = async (transferId: string) => {
    const userId = ledgerId;
    const pair = scheduledTransactions.filter(t => t.transfer_id === transferId);

    for (const t of pair) {
      await dataProvider.updateScheduledTransaction({
        ...t,
        transfer_id: null, // Clear link
        user_id: userId
      });
    }
    await invalidateAllData();
  };

  const updateScheduledTransaction = async (transaction: any) => {
    // Ensure we preserve user_id or set it if missing
    const userId = transaction.user_id || ledgerId;

    // 1. Determine if this update makes it a Transfer
    const isTargetTransfer = accounts.some(acc => acc.name === transaction.vendor);
    const hasTransferId = !!transaction.transfer_id;

    if (hasTransferId && !isTargetTransfer) {
      // CASE: Converting FROM Transfer TO Normal
      // 1. Delete the paired transaction
      const pair = scheduledTransactions.find(t => t.transfer_id === transaction.transfer_id && t.id !== transaction.id);
      if (pair) {
        // We delete the pair permanently/softly.
        // Let's use deleteMultiple to handle soft delete flow or just direct provider delete if we want to be silent?
        // Better to be safe and delete properly.
        await dataProvider.deleteScheduledTransaction(pair.id);
      }

      // 2. Update current transaction (remove transfer_id)
      await dataProvider.updateScheduledTransaction({
        ...transaction,
        transfer_id: null, // Clear it
        user_id: userId
      });

    } else if (!hasTransferId && isTargetTransfer) {
      // CASE: Converting FROM Normal TO Transfer
      const transferId = uuidv4();

      // 1. Update current (Source) with transfer_id
      const sourceUpdate = {
        ...transaction,
        transfer_id: transferId,
        category: 'Transfer',
        user_id: userId
      };
      await dataProvider.updateScheduledTransaction(sourceUpdate);

      // 2. Create DESTINATION pair
      const dest = {
        ...transaction,
        account: transaction.vendor,
        vendor: transaction.account,
        amount: -transaction.amount,
        transfer_id: transferId,
        user_id: userId,
        category: 'Transfer',
        id: uuidv4(), // Ensure distinct ID
        created_at: new Date().toISOString()
      };

      // We use addScheduledTransaction from provider directly to avoid the wrapper's "check for transfer" logic 
      // which might try to create another pair if we called context's addScheduledTransaction.
      await dataProvider.addScheduledTransaction(dest);

    } else if (hasTransferId && isTargetTransfer) {
      // CASE: Updating an existing Transfer

      // 1. Update primary
      await dataProvider.updateScheduledTransaction({
        ...transaction,
        user_id: userId
      });

      // 2. Sync Pair
      const pair = scheduledTransactions.find(t => t.transfer_id === transaction.transfer_id && t.id !== transaction.id);
      if (pair) {
        const pairUpdate = {
          ...pair,
          date: transaction.date,
          frequency: transaction.frequency,
          end_date: transaction.end_date,
          remarks: transaction.remarks,
          // Decoupled fields:
          // amount: -transaction.amount, (User wants independent editing)
          // account/vendor still need to be swapped if the user changed the vendor(account) on the primary.

          // If user changed the "Vendor" (which is the target account), we need to update the pair's "Account".
          account: transaction.vendor,

          // If user changed the "Account" (source), we need to update the pair's "Vendor".
          vendor: transaction.account,

          category: 'Transfer',
          transfer_id: transaction.transfer_id, // Ensure kept
        };
        await dataProvider.updateScheduledTransaction({
          ...pairUpdate,
          user_id: userId
        });
      }
    } else {
      // CASE: Normal Update (Normal -> Normal)
      await dataProvider.updateScheduledTransaction({
        ...transaction,
        user_id: userId
      });
    }

    await invalidateAllData();
  };

  const deleteScheduledTransaction = async (id: string) => {
    // Check if we have transfer_id passed or need to look it up
    // The signature in context is (id: string).
    // Let's resolve transfer_id from state if not passed.

    const idsToDelete = [id];

    // Look up transaction to see if it has transfer_id
    const tx = scheduledTransactions.find(t => t.id === id);
    if (tx && tx.transfer_id) {
      const pair = scheduledTransactions.find(t => t.transfer_id === tx.transfer_id && t.id !== id);
      if (pair) idsToDelete.push(pair.id);
    }

    await deleteMultipleScheduledTransactions(idsToDelete);
  };

  const deleteMultipleScheduledTransactions = async (ids: string[]) => {
    if (ids.length === 0) return;

    // Resolve all paired IDs
    const allIds = new Set(ids);
    ids.forEach(id => {
      const tx = scheduledTransactions.find(t => t.id === id);
      if (tx && tx.transfer_id) {
        const pair = scheduledTransactions.find(t => t.transfer_id === tx.transfer_id);
        if (pair) allIds.add(pair.id);
      }
    });

    const finalIds = Array.from(allIds);

    // 1. Soft Delete
    setHiddenScheduledIds(prev => {
      const next = new Set(prev);
      finalIds.forEach(id => next.add(id));
      return next;
    });

    // 2. Schedule Permanent Delete
    const timeoutId = setTimeout(async () => {
      await dataProvider.deleteMultipleScheduledTransactions(finalIds);

      undoStackRef.current = undoStackRef.current.filter(a => a.timeoutId !== timeoutId);
      await invalidateAllData();

      setHiddenScheduledIds(prev => {
        const next = new Set(prev);
        finalIds.forEach(id => next.delete(id));
        return next;
      });
    }, 7000);

    // 3. Push to Undo Stack
    undoStackRef.current.push({
      id: uuidv4(),
      type: 'DELETE_SCHEDULE',
      payload: { ids: finalIds },
      timeoutId
    });

    // 4. Show Toast
    showUndoToast(finalIds.length, "schedule");
  };



  const deleteBudget = (id: string) => {
    // 1. Soft Delete
    setHiddenBudgetIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // 2. Schedule Permanent Delete
    const timeoutId = setTimeout(async () => {
      await dataProvider.deleteBudget(id);

      undoStackRef.current = undoStackRef.current.filter(a => a.timeoutId !== timeoutId);
      await invalidateAllData(); // Budgets page refetches independently usually, but this doesn't hurt.
      // Actually Budgets page uses local state, it might need to refetch.
      // But we can't trigger refetch in Budgets page from here easily unless we share query.
      // Budgets page should probably lift state or use context.
      // For now, invalidating might not be enough if Budgets page doesn't use query key matched here.
      // But let's assume valid invalidation helps.

      setHiddenBudgetIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 7000);

    // 3. Push to Undo Stack
    undoStackRef.current.push({
      id: uuidv4(),
      type: 'DELETE_BUDGET',
      payload: { ids: [id] },
      timeoutId
    });

    // 4. Show Toast
    showUndoToast(1, "budget");
  };

  const deleteEntity = (type: 'vendor' | 'account' | 'category', ids: string[]) => {
    if (ids.length === 0) return;

    // 1. Soft Delete
    setHiddenEntityIds(prev => {
      const next = new Map(prev);
      const currentSet = new Set(next.get(type) || []);
      ids.forEach(id => currentSet.add(id));
      next.set(type, currentSet);
      return next;
    });

    // 2. Schedule Permanent Delete
    const timeoutId = setTimeout(async () => {
      if (type === 'vendor') {
        await db.vendors.bulkDelete(ids);
      } else if (type === 'account') {
        await db.accounts.bulkDelete(ids);
      } else if (type === 'category') {
        await db.categories.bulkDelete(ids);
      }

      undoStackRef.current = undoStackRef.current.filter(a => a.timeoutId !== timeoutId);
      await invalidateAllData();

      setHiddenEntityIds(prev => {
        const next = new Map(prev);
        const currentSet = new Set(next.get(type) || []);
        ids.forEach(id => currentSet.delete(id));
        next.set(type, currentSet);
        return next;
      });
    }, 7000);

    // 3. Push to Undo Stack
    undoStackRef.current.push({
      id: uuidv4(),
      type: 'DELETE_ENTITY',
      payload: { ids, entityType: type },
      timeoutId
    });

    // 4. Show Toast
    showUndoToast(ids.length, type);
  }

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
        if (t1.account === t2.account) continue;

        // Check 1: Strict Match (Same Currency, Same Amount)
        const isStrictMatch = t1.currency === t2.currency && Math.abs(t1.amount + t2.amount) <= 0.01;

        // Check 2: Cross-Currency/Heuristic Match
        // - Category is Transfer
        // - Opposite signs (Money leaving and money entering)
        // - Account/Vendor swap (Strongest signal) OR just strict Date + Transfer Category (User suggestion, but risky? Let's stick to swap + cat first, OR if cat is transfer and only 2 on that day?)
        // Let's go with Swap + Category OR Swap + Amount Signs?
        // User said: "given same transaction date and category used being transfer"
        const isTransferCat = (t1.category === 'Transfer' && t2.category === 'Transfer');
        const isOppositeSign = (t1.amount * t2.amount < 0);

        // Normalize names for comparison
        const t1Acc = (t1.account || '').trim().toLowerCase();
        const t1Vend = (t1.vendor || '').trim().toLowerCase();
        const t2Acc = (t2.account || '').trim().toLowerCase();
        const t2Vend = (t2.vendor || '').trim().toLowerCase();

        const isSwapped = (t1Acc === t2Vend && t2Acc === t1Vend);

        // Allow link if strict match OR (Transfer Category AND Opposite Signs AND (Swapped OR just Transfer Category if we want to be aggressive per user rq))
        // Being slightly conservative: Require Swapped OR (Transfer Cat AND Opposite Signs).
        // Actually, without Swap, linking any two random transfers on same day is risky.
        // But the user specially asked "make a guess about a pair given same transaction date and category used being transfer".
        // So I will support:
        // 1. Strict Match
        // 2. Swapped Entities (Strong)
        // 3. Just Transfer Category + Opposite Signs (Heuristic requested by user)

        let shouldLink = false;

        if (isStrictMatch) {
          shouldLink = true;
        } else if (isOppositeSign) {
          if (isSwapped) {
            shouldLink = true;
          } else if (isTransferCat) {
            // Heuristic: Same Date, Transfer Cat, Opposite Signs.
            // Maybe check if currencies differ to avoid linking same-currency mismatches (which might just be separate transactions)?
            // If currencies differ, it's likely a transfer.
            // If currencies SAME, but amounts differ, it's NOT a transfer (usually).
            if (t1.currency !== t2.currency) {
              shouldLink = true;
            }
          }
        }

        if (shouldLink) {
          await dataProvider.linkTransactionsAsTransfer(t1.id, t2.id);
          pairsLinked.push([t1.id, t2.id]);
          processedIds.add(t1.id);
          processedIds.add(t2.id);
          break;
        }
      }
    }

    if (pairsLinked.length > 0) {
      await invalidateAllData();
    }
    return pairsLinked.length;
  }, [transactions, dataProvider, invalidateAllData]);

  const unlinkTransaction = React.useCallback(async (transferId: string) => {
    await dataProvider.unlinkTransactions(transferId);
    await invalidateAllData();
  }, [dataProvider, invalidateAllData]);

  const linkTransactions = React.useCallback(async (id1: string, id2: string) => {
    await dataProvider.linkTransactionsAsTransfer(id1, id2);
    await invalidateAllData();
  }, [dataProvider, invalidateAllData]);

  const generateDiverseDemoData = async () => {
    try {
      await import('@/utils/demoDataGenerator').then(async (mod) => {
        await mod.generateDiverseDemoData(dataProvider, (progress) => {
          setOperationProgress({
            title: "Generating Demo Data",
            description: progress.stage,
            stage: progress.stage,
            progress: progress.progress,
            totalStages: progress.totalStages
          });
        });
      });

      // Cleanup and refresh
      await refreshLedgers();
      // Switch to first ledger if available? Or just refresh current
      const ledgers = await dataProvider.getLedgers();
      if (ledgers.length > 0) {
        await switchLedger(ledgers[0].id);
      }

      await invalidateAllData();
      await refetchTransactions();

    } catch (error) {
      console.error("Failed to generate demo data:", error);
    } finally {
      setOperationProgress({
        title: "Generating Demo Data",
        description: "Finalizing...",
        stage: 'Complete',
        progress: 100,
        totalStages: 100
      });
      // Clear progress after short delay
      setTimeout(() => setOperationProgress(null), 1000);
    }
  };

  const processScheduledTransactions = React.useCallback(async () => {
    if (isLoadingScheduledTransactions || scheduledTransactions.length === 0) return;

    // console.log("Checking for due scheduled transactions...");
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

    let processedCount = 0;

    for (const st of scheduledTransactions) {
      const nextDate = new Date(st.date);
      nextDate.setHours(0, 0, 0, 0);

      // If scheduled date is today or in the past
      if (nextDate <= today) {
        // Check if this specific date (ISO string match) is in ignored_dates
        // Note: st.date is the "next scheduled date". If we skipped it, it should be in ignored_dates.
        // We need to compare st.date with ignored_dates.
        const isIgnored = st.ignored_dates?.includes(st.date);

        if (isIgnored) {
          console.log(`Skipping ignored scheduled transaction: ${st.vendor} on ${st.date}`);
          // We must STILL advance the schedule, otherwise it will be stuck on this date forever!

          // ... Logic to advance Schedule duplicated ...
          // Refactor idea: Extract advance logic. But for now, copy-paste to be safe and sequential.
          let newNextDate = new Date(nextDate);

          let intervalValue = 1;
          let intervalUnit = 'm';

          if (['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(st.frequency)) {
            switch (st.frequency) {
              case 'Daily': intervalUnit = 'd'; break;
              case 'Weekly': intervalUnit = 'w'; break;
              case 'Monthly': intervalUnit = 'm'; break;
              case 'Yearly': intervalUnit = 'y'; break;
            }
          } else {
            const match = st.frequency.match(/^(\d+)([dwmy])$/);
            if (match) {
              intervalValue = parseInt(match[1], 10);
              intervalUnit = match[2];
            }
          }

          switch (intervalUnit) {
            case 'd': newNextDate.setDate(newNextDate.getDate() + intervalValue); break;
            case 'w': newNextDate.setDate(newNextDate.getDate() + (intervalValue * 7)); break;
            case 'm': newNextDate.setMonth(newNextDate.getMonth() + intervalValue); break;
            case 'y': newNextDate.setFullYear(newNextDate.getFullYear() + intervalValue); break;
            default: newNextDate.setMonth(newNextDate.getMonth() + 1); break;
          }

          await dataProvider.updateScheduledTransaction({
            ...st,
            date: newNextDate.toISOString()
          });

          // Continue to next item without creating transaction
          continue;
        }

        // console.log(`Processing due transaction: ${st.vendor} due on ${st.date}`);

        // 1. Create Real Transaction
        const transactionPayload = {
          date: nextDate < today ? startOfDay(today).toISOString() : st.date,
          account: st.account,
          vendor: st.vendor,
          category: st.category,
          sub_category: st.sub_category,
          amount: st.amount,
          currency: st.currency,
          remarks: st.remarks || "Recurring",
          is_scheduled_origin: true,
          user_id: st.user_id,
          recurrence_id: st.id
        };

        await addTransaction(transactionPayload);

        // 2. Advance Schedule
        let newNextDate = new Date(nextDate);

        let intervalValue = 1;
        let intervalUnit = 'm';

        if (['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(st.frequency)) {
          switch (st.frequency) {
            case 'Daily': intervalUnit = 'd'; break;
            case 'Weekly': intervalUnit = 'w'; break;
            case 'Monthly': intervalUnit = 'm'; break;
            case 'Yearly': intervalUnit = 'y'; break;
          }
        } else {
          const match = st.frequency.match(/^(\d+)([dwmy])$/);
          if (match) {
            intervalValue = parseInt(match[1], 10);
            intervalUnit = match[2];
          }
        }

        switch (intervalUnit) {
          case 'd': newNextDate.setDate(newNextDate.getDate() + intervalValue); break;
          case 'w': newNextDate.setDate(newNextDate.getDate() + (intervalValue * 7)); break;
          case 'm': newNextDate.setMonth(newNextDate.getMonth() + intervalValue); break;
          case 'y': newNextDate.setFullYear(newNextDate.getFullYear() + intervalValue); break;
          default: newNextDate.setMonth(newNextDate.getMonth() + 1); break;
        }

        await dataProvider.updateScheduledTransaction({
          ...st,
          date: newNextDate.toISOString()
        });

        processedCount++;
      }
    }

    if (processedCount > 0) {
      await invalidateAllData();
      // toast.success(`Processed ${processedCount} scheduled transactions.`); // Requires toast import or notifying user
      // console.log(`Processed ${processedCount} scheduled transactions.`);
    }
  }, [scheduledTransactions, isLoadingScheduledTransactions, dataProvider, invalidateAllData]);

  // Run on mount / data load
  React.useEffect(() => {
    if (!isLoadingScheduledTransactions) {
      processScheduledTransactions();
    }
  }, [scheduledTransactions.length, isLoadingScheduledTransactions, processScheduledTransactions]);

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
      const userId = ledgerId;

      const uniqueCategories = new Set<string>();
      const uniqueSubCategories = new Map<string, Set<string>>(); // category -> subCategories

      for (const t of transactions) {
        if (t.category) {
          uniqueCategories.add(t.category);
          if (t.sub_category) {
            if (!uniqueSubCategories.has(t.category)) {
              uniqueSubCategories.set(t.category, new Set());
            }
            uniqueSubCategories.get(t.category)!.add(t.sub_category);
          }
        }
      }

      const categoryIdMap = new Map<string, string>();

      // 1. Ensure Categories
      for (const catName of uniqueCategories) {
        const catId = await dataProvider.ensureCategoryExists(catName, userId);
        if (catId) {
          categoryIdMap.set(catName, catId);
        }
      }

      // 2. Ensure SubCategories
      for (const [catName, subs] of uniqueSubCategories) {
        const catId = categoryIdMap.get(catName);
        if (catId) {
          for (const subName of subs) {
            await dataProvider.ensureSubCategoryExists(subName, catId, userId);
          }
        }
      }
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
        refetchVendors();
        refetchAccounts();
      });
    }
  }, [transactions, isLoadingTransactions, isLoadingCategories, isLoadingSubCategories, dataProvider, ledgerId, refetchCategories, refetchSubCategories, detectAndLinkTransfers, refetchTransactions, refetchVendors, refetchAccounts]);

  const filteredVendors = React.useMemo(() => {
    const hidden = hiddenEntityIds.get('vendor');
    if (!hidden || hidden.size === 0) return vendors;
    return vendors.filter(v => !hidden.has(v.id));
  }, [vendors, hiddenEntityIds]);

  const filteredAccounts = React.useMemo(() => {
    const hidden = hiddenEntityIds.get('account');
    if (!hidden || hidden.size === 0) return accounts;
    return accounts.filter(a => !hidden.has(a.id));
  }, [accounts, hiddenEntityIds]);

  const filteredCategories = React.useMemo(() => {
    const hidden = hiddenEntityIds.get('category');
    if (!hidden || hidden.size === 0) return categories;
    return categories.filter(c => !hidden.has(c.id));
  }, [categories, hiddenEntityIds]);

  const value = React.useMemo(() => ({
    transactions, vendors: filteredVendors, accounts: filteredAccounts, categories: filteredCategories, accountCurrencyMap, allSubCategories, subCategories,
    addTransaction, updateTransaction, deleteTransaction, deleteMultipleTransactions, clearAllTransactions,
    generateDiverseDemoData, processScheduledTransactions,
    refetchVendors, refetchAccounts, refetchCategories, refetchSubCategories,
    invalidateAllData,
    refetchTransactions,
    operationProgress, setOperationProgress,
    isLoadingTransactions, isLoadingVendors, isLoadingAccounts, isLoadingCategories, isLoadingSubCategories,
    scheduledTransactions, isLoadingScheduledTransactions, refetchScheduledTransactions,
    addScheduledTransaction, updateScheduledTransaction, deleteScheduledTransaction, unlinkScheduledTransaction,
    deleteMultipleScheduledTransactions,
    detectAndLinkTransfers,
    unlinkTransaction,
    linkTransactions,
    deleteBudget, deleteEntity, hiddenBudgetIds
  }), [
    transactions, filteredVendors, filteredAccounts, filteredCategories, subCategories, accountCurrencyMap, allSubCategories,
    refetchVendors, refetchAccounts, refetchCategories, refetchSubCategories, invalidateAllData, refetchTransactions,
    operationProgress,
    isLoadingTransactions, isLoadingVendors, isLoadingAccounts, isLoadingCategories, isLoadingSubCategories,
    scheduledTransactions, isLoadingScheduledTransactions, refetchScheduledTransactions,
    addTransaction, updateTransaction, deleteTransaction, deleteMultipleScheduledTransactions, clearAllTransactions,
    generateDiverseDemoData, addScheduledTransaction, updateScheduledTransaction, deleteScheduledTransaction,
    deleteMultipleScheduledTransactions,
    detectAndLinkTransfers,
    unlinkTransaction,
    linkTransactions,
    deleteBudget, deleteEntity, hiddenBudgetIds
  ]);

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

/**
 * Hook to access the Transactions context.
 * Provides access to transaction data, metadata (accounts, vendors, categories),
 * and operations for managing them.
 */
export const useTransactions = () => {
  const context = React.useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};