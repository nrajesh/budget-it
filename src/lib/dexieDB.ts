import Dexie, { Table } from 'dexie';
import { Transaction, Budget, Vendor, Category, ScheduledTransaction } from '@/types/dataProvider';

// Extend the interfaces to include Dexie-specific keys (optional, but good for TS)
// We reuse the DataProvider interfaces which already have 'id'.

export interface SubCategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export interface Account {
  id: string;
  currency: string;
  starting_balance: number;
  remarks: string;
  created_at: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Investment' | 'Other';
  credit_limit?: number;
}

export class FinanceDatabase extends Dexie {
  transactions!: Table<Transaction>;
  scheduled_transactions!: Table<ScheduledTransaction>;
  budgets!: Table<Budget>;
  vendors!: Table<Vendor>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  sub_categories!: Table<SubCategory>;

  constructor() {
    super('FinanceTrackerDB');

    // Schema definition
    // Note: ++id is not used because we use UUIDs (strings) for compatibility
    this.version(5).stores({
      transactions: 'id, user_id, date, account, vendor, category, transfer_id, recurrence_id',
      scheduled_transactions: 'id, user_id, date, account, vendor',
      budgets: 'id, user_id, category_name',
      vendors: 'id, name, is_account, account_id',
      accounts: 'id, type', // Added type for indexing if needed
      categories: 'id, user_id, name',
      sub_categories: 'id, user_id, category_id, name'
    });
  }
}

export const db = new FinanceDatabase();
