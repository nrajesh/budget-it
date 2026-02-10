import Dexie, { Table } from "dexie";
import {
  Transaction,
  Budget,
  Vendor,
  Category,
  ScheduledTransaction,
  Account,
  SubCategory,
} from "@/types/dataProvider";

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

export interface BackupConfig {
  id: string;
  frequency: number; // in milliseconds
  isActive: boolean;
  nextBackup: string; // ISO string
  lastBackup?: string; // ISO string
  directoryHandle?: any; // Serialized handle? No, handles can't be stored in IDB directly in all browsers easily, but we'll try storing the handle object which Dexie supports if the browser supports structured cloning of handles.
  // Actually, handles CAN be stored in IDB.
  path?: string; // Electron: Full file path
  encrypted?: boolean;
  passwordHash?: string; // Not storing actual password for security, we will ask user or store a derived key if we want fully auto.
  // For fully automated background backups without user interaction, we might need to store the key in memory or session,
  // but if the app reloads, we need the password again.
  // Requirement says: "checkbox... enable password field".
  // If we want auto-backups to run *without* user typing password every time, we typically need to store the key.
  // For this local-first app, we can store the encryption password (or derived key) in IDB, perhaps obfuscated,
  // acknowledging the security tradeoff for convenience, or request it on session start.
  // Given "User desires an encrypted backup", we should probably store the key if we want it to run in background.
  // Let's store a flag for now, and we'll handle key management in the component.
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
  backup_configs!: Table<BackupConfig>;

  constructor() {
    super("FinanceTrackerDB");

    // Schema definition
    // Note: ++id is not used because we use UUIDs (strings) for compatibility
    this.version(7).stores({
      transactions:
        "id, user_id, date, account, vendor, category, transfer_id, recurrence_id",
      scheduled_transactions: "id, user_id, date, account, vendor",
      budgets: "id, user_id, category_name",
      vendors: "id, [user_id+name], name, is_account, account_id, user_id", // Added user_id to indexes
      accounts: "id, user_id, type", // Added user_id
      categories: "id, [user_id+name], user_id, name",
      sub_categories: "id, user_id, category_id, name",
      ledgers: "id, name, last_accessed",
      backup_configs: "id, isActive, nextBackup", // Added for scheduled backups
    });
  }
}

// Singleton pattern to prevent multiple instances during HMR
const globalForDb = globalThis as unknown as {
  financeTrackerDb: FinanceDatabase | undefined;
};

export const db = globalForDb.financeTrackerDb ?? new FinanceDatabase();

// Add listeners for debugging blocking issues
db.on("blocked", () => {
  console.error(
    "[Dexie] Database operation BLOCKED. You may have another tab open.",
  );
});

db.on("versionchange", () => {
  console.warn(
    "[Dexie] Database version change detected. Closing connection to allow upgrade.",
  );
  db.close();
});

if (process.env.NODE_ENV !== "production") globalForDb.financeTrackerDb = db;
