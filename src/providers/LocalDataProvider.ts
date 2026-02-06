import { DataProvider, Transaction, Budget, Vendor, Category, Account, ScheduledTransaction, SubCategory, Ledger } from '../types/dataProvider';
import { db } from '@/lib/dexieDB';
import { v4 as uuidv4 } from 'uuid';

export class LocalDataProvider implements DataProvider {
  // Ledgers
  async getLedgers(): Promise<Ledger[]> {
    return await db.ledgers.orderBy('last_accessed').reverse().toArray();
  }

  async addLedger(ledger: Omit<Ledger, 'id' | 'created_at' | 'last_accessed'>): Promise<Ledger> {
    const newLedger: Ledger = {
      ...ledger,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString()
    };
    await db.ledgers.add(newLedger);
    return newLedger;
  }

  async updateLedger(ledger: Ledger): Promise<void> {
    await db.ledgers.put(ledger);
  }

  async deleteLedger(id: string): Promise<void> {
    await db.transaction('rw', [db.ledgers, db.transactions, db.scheduled_transactions, db.budgets, db.vendors, db.accounts, db.categories, db.sub_categories], async () => {
      // Delete Ledger
      await db.ledgers.delete(id);

      // Cascade delete all scoped data
      await db.transactions.where('user_id').equals(id).delete();
      await db.scheduled_transactions.where('user_id').equals(id).delete();
      await db.budgets.where('user_id').equals(id).delete();
      await db.vendors.where('user_id').equals(id).delete();
      await db.accounts.where('user_id').equals(id).delete();
      await db.categories.where('user_id').equals(id).delete();
      await db.sub_categories.where('user_id').equals(id).delete();
    });
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    // userId is now strictly required (it's the Ledger ID)
    if (userId) {
      return await db.transactions.where('user_id').equals(userId).reverse().sortBy('date');
    }
    // Fallback for migration/empty state - shouldn't happen normally in new logic
    return await db.transactions.orderBy('date').reverse().toArray();
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const userId = transaction.user_id || 'local-user';

    // Ensure category exists
    let catId = null;
    if (transaction.category) {
      catId = await this.ensureCategoryExists(transaction.category, userId);

      // Ensure sub-category exists if provided
      if (transaction.sub_category && catId) {
        await this.ensureSubCategoryExists(transaction.sub_category, catId, userId);
      }
    }

    // Ensure Vendor/Payee exists
    if (transaction.vendor) {
      await this.ensurePayeeExists(transaction.vendor, false, userId, { currency: transaction.currency });
    }

    // Ensure Account exists
    if (transaction.account) {
      await this.ensurePayeeExists(transaction.account, true, userId, { currency: transaction.currency });
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    await db.transactions.add(newTransaction);
    return newTransaction;
  }

  async addMultipleTransactions(transactions: Omit<Transaction, 'id' | 'created_at'>[]): Promise<Transaction[]> {
    const newTransactions: Transaction[] = transactions.map(t => ({
      ...t,
      id: uuidv4(),
      created_at: new Date().toISOString()
    }));

    // We assume caller (e.g. CSV import) has already ensured categories/payees exist
    // to avoid N+1 reads here.

    await db.transactions.bulkAdd(newTransactions);
    return newTransactions;
  }

  async updateTransaction(transaction: Transaction): Promise<void> {
    const userId = transaction.user_id || 'local-user';

    // Ensure category/sub-category exist
    let catId = null;
    if (transaction.category) {
      catId = await this.ensureCategoryExists(transaction.category, userId);
      if (transaction.sub_category && catId) {
        await this.ensureSubCategoryExists(transaction.sub_category, catId, userId);
      }
    }

    await db.transactions.put(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.transactions.delete(id);
  }

  async deleteMultipleTransactions(ids: string[]): Promise<void> {
    await db.transactions.bulkDelete(ids);
  }

  async deleteTransactionByTransferId(transferId: string): Promise<void> {
    const transactionsToDelete = await db.transactions.where('transfer_id').equals(transferId).toArray();
    await db.transactions.bulkDelete(transactionsToDelete.map(t => t.id));
  }

  async clearTransactions(userId: string): Promise<void> {
    if (userId) {
      await db.transactions.where('user_id').equals(userId).delete();
    } else {
      await db.transactions.clear();
    }
  }

  async clearBudgets(userId: string): Promise<void> {
    if (userId) {
      await db.budgets.where('user_id').equals(userId).delete();
    } else {
      await db.budgets.clear();
    }
  }

  async clearScheduledTransactions(userId: string): Promise<void> {
    if (userId) {
      await db.scheduled_transactions.where('user_id').equals(userId).delete();
    } else {
      await db.scheduled_transactions.clear();
    }
  }

  // Scheduled Transactions
  async getScheduledTransactions(userId: string): Promise<ScheduledTransaction[]> {
    if (userId) {
      return await db.scheduled_transactions.where('user_id').equals(userId).reverse().sortBy('date');
    }
    return await db.scheduled_transactions.orderBy('date').reverse().toArray();
  }

  async addScheduledTransaction(transaction: Omit<ScheduledTransaction, 'id' | 'created_at'>): Promise<ScheduledTransaction> {
    const userId = transaction.user_id || 'local-user';

    // Ensure category/sub-category exist
    let catId = null;
    if (transaction.category) {
      catId = await this.ensureCategoryExists(transaction.category, userId);
      if (transaction.sub_category && catId) {
        await this.ensureSubCategoryExists(transaction.sub_category, catId, userId);
      }
    }

    const newTransaction: ScheduledTransaction = {
      ...transaction,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    await db.scheduled_transactions.add(newTransaction);
    return newTransaction;
  }

  async updateScheduledTransaction(transaction: ScheduledTransaction): Promise<void> {
    const userId = transaction.user_id || 'local-user';

    // Ensure category/sub-category exist
    let catId = null;
    if (transaction.category) {
      catId = await this.ensureCategoryExists(transaction.category, userId);
      if (transaction.sub_category && catId) {
        await this.ensureSubCategoryExists(transaction.sub_category, catId, userId);
      }
    }

    await db.scheduled_transactions.put(transaction);
  }

  async deleteScheduledTransaction(id: string): Promise<void> {
    await db.scheduled_transactions.delete(id);
  }

  async deleteMultipleScheduledTransactions(ids: string[]): Promise<void> {
    await db.scheduled_transactions.bulkDelete(ids);
  }

  // Payees/Vendors/Accounts
  async ensurePayeeExists(rawName: string, isAccount: boolean, userId: string, options?: { currency?: string; startingBalance?: number; remarks?: string, type?: Account['type'], creditLimit?: number }): Promise<string | null> {
    if (!rawName) return null;
    const name = rawName.trim();

    // Scope check to userId
    const vendor = await db.vendors.where('[user_id+name]').equals([userId, name]).first();

    if (vendor) {
      if (isAccount) {
        // Ensure it's an account
        let accountId = vendor.account_id;

        if (!accountId) {
          // Create account entry
          accountId = uuidv4();
          await db.accounts.add({
            id: accountId,
            user_id: userId,
            currency: options?.currency || 'USD',
            starting_balance: options?.startingBalance || 0,
            remarks: options?.remarks || `Auto-created account for vendor: ${name}`,
            created_at: new Date().toISOString(),
            type: options?.type || 'Checking',
            credit_limit: options?.creditLimit
          });

          // Update vendor
          await db.vendors.update(vendor.id, { is_account: true, account_id: accountId });
        } else {
          // Ensure account exists (data integrity)
          const account = await db.accounts.get(accountId);
          if (!account) {
            await db.accounts.add({
              id: accountId,
              user_id: userId,
              currency: options?.currency || 'USD',
              starting_balance: options?.startingBalance || 0,
              remarks: options?.remarks || `Auto-created account for vendor: ${name}`,
              created_at: new Date().toISOString(),
              type: options?.type || 'Checking',
              credit_limit: options?.creditLimit
            });
          }
        }
      }
      return vendor.id;
    } else {
      // Create new vendor
      let accountId: string | null = null;
      if (isAccount) {
        accountId = uuidv4();
        await db.accounts.add({
          id: accountId,
          user_id: userId,
          currency: options?.currency || 'USD',
          starting_balance: options?.startingBalance || 0,
          remarks: options?.remarks || `Auto-created account for vendor: ${name}`,
          created_at: new Date().toISOString(),
          type: options?.type || 'Checking',
          credit_limit: options?.creditLimit
        });
      }

      const newVendorId = uuidv4();
      await db.vendors.add({
        id: newVendorId,
        user_id: userId,
        name: name,
        is_account: isAccount,
        account_id: accountId
      });
      return newVendorId;
    }
  }

  async checkIfPayeeIsAccount(name: string, userId: string): Promise<boolean> {
    const vendor = await db.vendors.where('[user_id+name]').equals([userId, name]).first();
    return vendor?.is_account || false;
  }

  async getAccountCurrency(accountName: string, userId: string): Promise<string> {
    const vendor = await db.vendors.where('[user_id+name]').equals([userId, accountName]).first();
    if (vendor && vendor.account_id) {
      const account = await db.accounts.get(vendor.account_id);
      return account?.currency || 'USD';
    }
    return 'USD';
  }

  async getAllVendors(userId: string): Promise<Vendor[]> {
    if (userId) {
      return await db.vendors.where('user_id').equals(userId).toArray();
    }
    return await db.vendors.toArray();
  }

  async getVendorByName(name: string, userId: string): Promise<Vendor | undefined> {
    return await db.vendors.where('[user_id+name]').equals([userId, name]).first();
  }

  async mergePayees(targetName: string, sourceNames: string[], userId: string): Promise<void> {
    await db.transaction('rw', db.transactions, db.vendors, db.accounts, async () => {
      // 1. Update Transactions
      // Find transactions where account is in sourceNames
      await db.transactions.where('user_id').equals(userId).and(t => sourceNames.includes(t.account)).modify({ account: targetName });

      // Find transactions where vendor is in sourceNames
      await db.transactions.where('user_id').equals(userId).and(t => sourceNames.includes(t.vendor)).modify({ vendor: targetName });

      // 2. Delete source vendors/accounts
      // Get IDs of source vendors to delete accounts if linked
      const sourceVendors = await db.vendors.where('[user_id+name]').anyOf(sourceNames.map(name => [userId, name])).toArray();
      const accountIdsToDelete = sourceVendors.map(v => v.account_id).filter(id => id != null) as string[];

      // Delete from vendors
      await db.vendors.bulkDelete(sourceVendors.map(v => v.id));

      // Delete from accounts
      if (accountIdsToDelete.length > 0) {
        await db.accounts.bulkDelete(accountIdsToDelete);
      }
    });
  }

  async deletePayee(id: string): Promise<void> {
    const vendor = await db.vendors.get(id);
    if (!vendor) return;

    await db.vendors.delete(id);
    if (vendor.account_id) {
      // Also delete the account record? Or just leave it?
      // Usually safe to delete if it's 1:1 map
      await db.accounts.delete(vendor.account_id);
    }
  }

  async getAllAccounts(userId: string): Promise<Account[]> {
    if (userId) {
      return await db.accounts.where('user_id').equals(userId).toArray();
    }
    return await db.accounts.toArray();
  }


  // Categories
  async ensureCategoryExists(rawName: string, userId: string): Promise<string | null> {
    if (!rawName) return null;
    const name = rawName.trim();
    // Scope to userId
    const category = await db.categories.where('[user_id+name]').equals([userId, name]).first();

    if (category) return category.id;

    const newId = uuidv4();
    await db.categories.add({
      id: newId,
      user_id: userId,
      name: name,
      created_at: new Date().toISOString()
    });
    return newId;
  }

  async ensureSubCategoryExists(rawName: string, categoryId: string, userId: string): Promise<string | null> {
    if (!rawName || !categoryId) return null;
    const name = rawName.trim();

    // Scope to userId implicitly via category_id (which is scoped) but also explicit user_id field
    const sub = await db.sub_categories
      .where('category_id').equals(categoryId)
      .and(s => s.name === name)
      .first();

    if (sub) return sub.id;

    const newId = uuidv4();
    await db.sub_categories.add({
      id: newId,
      user_id: userId,
      category_id: categoryId,
      name: name,
      created_at: new Date().toISOString()
    });
    return newId;
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    if (userId) {
      return await db.categories.where('user_id').equals(userId).sortBy('name');
    }
    return await db.categories.orderBy('name').toArray();
  }

  async getSubCategories(userId: string): Promise<SubCategory[]> {
    if (userId) {
      return await db.sub_categories.where('user_id').equals(userId).sortBy('name');
    }
    return await db.sub_categories.orderBy('name').toArray();
  }

  async mergeCategories(targetName: string, sourceNames: string[], userId: string): Promise<void> {
    await db.transaction('rw', db.transactions, db.categories, db.sub_categories, db.budgets, async () => {
      // 1. Update Transactions
      // Filter by userId
      await db.transactions.where('user_id').equals(userId).and(t => sourceNames.includes(t.category)).modify({ category: targetName });

      // 2. Update Budgets?
      await db.budgets.where('user_id').equals(userId).and(b => sourceNames.includes(b.category_name)).modify({ category_name: targetName });

      // 3. Move Sub-categories?
      const targetCategory = await db.categories.where('[user_id+name]').equals([userId, targetName]).first();

      if (targetCategory) {
        const sourceCategories = await db.categories.where('[user_id+name]').anyOf(sourceNames.map(name => [userId, name])).toArray();
        const sourceIds = sourceCategories.map(c => c.id);

        // Move sub-categories
        await db.sub_categories.where('category_id').anyOf(sourceIds).modify({ category_id: targetCategory.id });
      }

      // 4. Delete source categories
      // Need IDs to delete safely or use exact match
      const sourceCategories = await db.categories.where('[user_id+name]').anyOf(sourceNames.map(name => [userId, name])).toArray();
      await db.categories.bulkDelete(sourceCategories.map(c => c.id));
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await db.categories.delete(id);
    // Cascade delete sub-categories?
    await db.sub_categories.where('category_id').equals(id).delete();
  }

  // Budgets
  async getBudgetsWithSpending(userId: string): Promise<Budget[]> {
    // Replicating RPC 'get_budgets_with_spending'
    const budgets = userId
      ? await db.budgets.where('user_id').equals(userId).toArray()
      : await db.budgets.toArray();

    const budgetsWithSpending: Budget[] = [];

    // Fetch accounts to map Name -> Type for this user
    // Optimization: Only fetch needed accounts/vendors
    const allAccounts = userId
      ? await db.accounts.where('user_id').equals(userId).toArray()
      : await db.accounts.toArray();

    const allVendors = userId
      ? await db.vendors.where('user_id').equals(userId).toArray()
      : await db.vendors.toArray();

    // Create Map: AccountName -> Type
    const accountTypeMap = new Map<string, string>();
    allVendors.filter(v => v.is_account).forEach(v => {
      const acc = allAccounts.find(a => a.id === v.account_id);
      if (acc && v.name) {
        accountTypeMap.set(v.name.trim().toLowerCase(), acc.type || 'Checking');
      }
    });

    for (const budget of budgets) {
      const transactions = await db.transactions
        .where('date')
        .aboveOrEqual(budget.start_date)
        .and(t => {
          if (budget.end_date && t.date > budget.end_date) return false;
          if (t.category !== budget.category_name) return false;
          if (budget.sub_category_name && t.sub_category !== budget.sub_category_name) return false;
          if (t.user_id !== userId && userId) return false; // Safety check

          // Account Scope Logic
          if (budget.account_scope === 'GROUP' && budget.account_scope_values && budget.account_scope_values.length > 0) {
            const accountName = (t.account || '').trim().toLowerCase();
            const accountType = accountTypeMap.get(accountName);

            if (!accountType || !budget.account_scope_values.includes(accountType)) {
              return false;
            }
          }

          return true;
        })
        .toArray();

      const total = transactions.reduce((acc, t) => {
        if (t.amount < 0) return acc + Math.abs(t.amount);
        return acc;
      }, 0);

      budgetsWithSpending.push({
        ...budget,
        spent_amount: total
      });
    }

    return budgetsWithSpending;
  }

  async addBudget(budget: Omit<Budget, 'id' | 'spent_amount'>): Promise<void> {
    await db.budgets.add({
      ...budget,
      id: uuidv4(),
      spent_amount: 0, // Initial
      is_active: budget.is_active ?? true,
      created_at: budget.created_at || new Date().toISOString()
    });
  }

  async updateBudget(budget: Budget): Promise<void> {
    await db.budgets.put(budget);
  }

  async deleteBudget(id: string): Promise<void> {
    await db.budgets.delete(id);
  }

  // Maintenance
  async linkTransactionsAsTransfer(id1: string, id2: string): Promise<void> {
    const transferId = uuidv4();
    await db.transaction('rw', [db.transactions, db.categories], async () => {
      const t1 = await db.transactions.get(id1);
      const t2 = await db.transactions.get(id2);

      if (!t1 || !t2) return;

      const userId = t1.user_id || t2.user_id || 'local-user';
      await this.ensureCategoryExists('Transfer', userId);

      await db.transactions.update(id1, { transfer_id: transferId, category: 'Transfer' });
      await db.transactions.update(id2, { transfer_id: transferId, category: 'Transfer' });
    });
  }

  async unlinkTransactions(transferId: string): Promise<void> {
    await db.transaction('rw', db.transactions, async () => {
      const transactions = await db.transactions.where('transfer_id').equals(transferId).toArray();
      for (const t of transactions) {
        await db.transactions.update(t.id, { transfer_id: null }); // Keep category as is (User can change manually)
      }
    });
  }

  async clearAllData(): Promise<void> {
    // Clear tables sequentially to avoid deadlocks from acquiring locks on all tables simultaneously.
    // While less atomic, it is more robust for a "reset" operation where partial failure isn't critical (as we are wiping anyway).
    await db.transactions.clear();
    await db.scheduled_transactions.clear();
    await db.budgets.clear();
    await db.vendors.clear();
    await db.accounts.clear();
    await db.categories.clear();
    await db.sub_categories.clear();
    await db.ledgers.clear();
  }

  // Migration Utils
  async exportData(userId?: string): Promise<any> {
    // Helper to rename user_id to ledger_id
    const mapToLedgerId = (items: any[]) => items.map(item => {
      const { user_id, ...rest } = item;
      return { ...rest, ledger_id: user_id };
    });

    if (userId) {
      // Export scoped data
      return {
        transactions: mapToLedgerId(await db.transactions.where('user_id').equals(userId).toArray()),
        scheduled_transactions: mapToLedgerId(await db.scheduled_transactions.where('user_id').equals(userId).toArray()),
        budgets: mapToLedgerId(await db.budgets.where('user_id').equals(userId).toArray()),
        vendors: mapToLedgerId(await db.vendors.where('user_id').equals(userId).toArray()),
        accounts: mapToLedgerId(await db.accounts.where('user_id').equals(userId).toArray()),
        categories: mapToLedgerId(await db.categories.where('user_id').equals(userId).toArray()),
        sub_categories: mapToLedgerId(await db.sub_categories.where('user_id').equals(userId).toArray()),
        version: 2, // Bump version
        exportedAt: new Date().toISOString()
      };
    }

    // Full export (legacy or admin)
    const data = {
      transactions: mapToLedgerId(await db.transactions.toArray()),
      scheduled_transactions: mapToLedgerId(await db.scheduled_transactions.toArray()),
      budgets: mapToLedgerId(await db.budgets.toArray()),
      vendors: mapToLedgerId(await db.vendors.toArray()),
      accounts: mapToLedgerId(await db.accounts.toArray()),
      categories: mapToLedgerId(await db.categories.toArray()),
      sub_categories: mapToLedgerId(await db.sub_categories.toArray()),
      ledgers: await db.ledgers.toArray(),
      version: 2,
      exportedAt: new Date().toISOString()
    };
    return data;
  }

  async importData(data: any, userId?: string): Promise<void> {
    if (!data || !data.transactions) throw new Error("Invalid data format");

    // Helper to map ledger_id back to user_id (for internal DB compatibility)
    // If incoming data has user_id, keep it (legacy backup). If ledger_id, map it.
    const mapToUserId = (items: any[], overrideUserId?: string) => items.map(item => {
      // If we are importing into a specific scope (overrideUserId), we FORCE that ID.
      if (overrideUserId) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ledger_id, user_id, ...rest } = item;
        return { ...rest, user_id: overrideUserId };
      }

      // Otherwise, we restore the ID from the file (ledger_id or user_id)
      const { ledger_id, user_id, ...rest } = item;
      const finalId = ledger_id || user_id;
      return { ...rest, user_id: finalId };
    });

    await db.transaction('rw', [db.transactions, db.scheduled_transactions, db.budgets, db.vendors, db.accounts, db.categories, db.sub_categories, db.ledgers], async () => {
      if (userId) {
        // Import into specific ledger. Remove existing data for this ledger first?
        // Maybe user wants to merge? 
        // "Imports/exports (transactions + backups) will be scoped to a ledger."
        // Let's assume replace or we just add. For safety let's just add new IDs if not merging?
        // For now, let's implement simple atomic import:

        // 1. Prepare data with userId override
        const transactions = mapToUserId(data.transactions || [], userId);
        const scheduled = mapToUserId(data.scheduled_transactions || [], userId);
        const budgets = mapToUserId(data.budgets || [], userId);
        const vendors = mapToUserId(data.vendors || [], userId);
        const accounts = mapToUserId(data.accounts || [], userId);
        const categories = mapToUserId(data.categories || [], userId);
        const subCategories = mapToUserId(data.sub_categories || [], userId);

        // 2. Clear existing for this ledger
        await this.clearTransactions(userId);
        await this.clearScheduledTransactions(userId);
        await this.clearBudgets(userId);

        await db.vendors.where('user_id').equals(userId).delete();
        await db.accounts.where('user_id').equals(userId).delete();
        await db.categories.where('user_id').equals(userId).delete();
        await db.sub_categories.where('user_id').equals(userId).delete();

        await db.transactions.bulkPut(transactions);
        await db.scheduled_transactions.bulkPut(scheduled);
        await db.budgets.bulkPut(budgets);
        await db.vendors.bulkPut(vendors);
        await db.accounts.bulkPut(accounts);
        await db.categories.bulkPut(categories);
        await db.sub_categories.bulkPut(subCategories);

      } else {
        // Full Restore (Dangerous)
        await db.transactions.clear();
        await db.scheduled_transactions.clear();
        await db.budgets.clear();
        await db.vendors.clear();
        await db.accounts.clear();
        await db.categories.clear();
        await db.sub_categories.clear();
        await db.ledgers.clear();

        if (data.ledgers) await db.ledgers.bulkAdd(data.ledgers);

        if (data.transactions) await db.transactions.bulkAdd(mapToUserId(data.transactions));
        if (data.scheduled_transactions) await db.scheduled_transactions.bulkAdd(mapToUserId(data.scheduled_transactions));
        if (data.budgets) await db.budgets.bulkAdd(mapToUserId(data.budgets));
        if (data.vendors) await db.vendors.bulkAdd(mapToUserId(data.vendors));
        if (data.accounts) await db.accounts.bulkAdd(mapToUserId(data.accounts));
        if (data.categories) await db.categories.bulkAdd(mapToUserId(data.categories));
        if (data.sub_categories) await db.sub_categories.bulkAdd(mapToUserId(data.sub_categories));
      }
    });
  }
}
