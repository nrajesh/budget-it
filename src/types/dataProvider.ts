export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  currency: string;
  account: string;
  vendor: string;
  category: string;
  sub_category?: string | null;
  remarks?: string | null;
  is_scheduled_origin?: boolean;
  transfer_id?: string | null;
  recurrence_id?: string | null;
  recurrence_frequency?: string | null;
  recurrence_end_date?: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  sub_category_id?: string | null;
  sub_category_name?: string | null;
  target_amount: number;
  spent_amount: number;
  currency: string;
  start_date: string;
  end_date: string | null;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly' | 'One-time';
}

export interface Vendor {
  id: string;
  name: string;
  is_account: boolean;
  account_id?: string | null;
}

export interface Account {
  id: string;
  currency: string;
  starting_balance: number;
  remarks: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface DataProvider {
  // Transactions
  getTransactions(userId: string): Promise<Transaction[]>;
  addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction>;
  updateTransaction(transaction: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  deleteTransactionByTransferId(transferId: string): Promise<void>;

  // Payees/Vendors/Accounts
  ensurePayeeExists(name: string, isAccount: boolean, options?: { currency?: string; startingBalance?: number; remarks?: string }): Promise<string | null>;
  checkIfPayeeIsAccount(name: string): Promise<boolean>;
  getAccountCurrency(accountName: string): Promise<string>;
  getAllVendors(): Promise<Vendor[]>;
  mergePayees(targetName: string, sourceNames: string[]): Promise<void>;
  deletePayee(id: string): Promise<void>;
  getAllAccounts(): Promise<Account[]>;

  // Categories
  ensureCategoryExists(name: string, userId: string): Promise<string | null>;
  ensureSubCategoryExists(name: string, categoryId: string, userId: string): Promise<string | null>;
  getUserCategories(userId: string): Promise<Category[]>;
  mergeCategories(targetName: string, sourceNames: string[]): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // Budgets
  getBudgetsWithSpending(userId: string): Promise<Budget[]>;
  addBudget(budget: Omit<Budget, 'id' | 'spent_amount'>): Promise<void>;
  updateBudget(budget: Budget): Promise<void>;
  deleteBudget(id: string): Promise<void>;

  // Maintenance
  clearAllData(): Promise<void>;
  exportData?(): Promise<any>;
  importData?(data: any): Promise<void>;
}
