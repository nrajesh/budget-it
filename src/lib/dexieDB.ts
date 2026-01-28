import Dexie, { Table } from 'dexie';
import { Transaction, Budget, Vendor, Category, ScheduledTransaction, Account, SubCategory } from '@/types/dataProvider';

// Extend the interfaces to include Dexie-specific keys (optional, but good for TS)
// We reuse the DataProvider interfaces which already have 'id'.

// Interfaces removed; imported from types/dataProvider
// Extended interfaces can be defined here if strictly Dexie specific, but we use shared ones.


export interface Ledger {
  id: string;
  name: string;
  short_name?: string;
  icon?: string;
  currency: string;
  created_at: string;
  last_accessed: string;
}

export class FinanceDatabase extends Dexie {
  transactions!: Table<Transaction>;
  scheduled_transactions!: Table<ScheduledTransaction>;
  budgets!: Table<Budget>;
  vendors!: Table<Vendor>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  sub_categories!: Table<SubCategory>;
  ledgers!: Table<Ledger>;

  constructor() {
    super('FinanceTrackerDB');

    // Schema definition
    // Note: ++id is not used because we use UUIDs (strings) for compatibility
    this.version(6).stores({
      transactions: 'id, user_id, date, account, vendor, category, transfer_id, recurrence_id',
      scheduled_transactions: 'id, user_id, date, account, vendor',
      budgets: 'id, user_id, category_name',
      vendors: 'id, [user_id+name], name, is_account, account_id, user_id', // Added user_id to indexes
      accounts: 'id, user_id, type', // Added user_id
      categories: 'id, [user_id+name], user_id, name',
      sub_categories: 'id, user_id, category_id, name',
      ledgers: 'id, name, last_accessed'
    });
  }
}

export const db = new FinanceDatabase();
