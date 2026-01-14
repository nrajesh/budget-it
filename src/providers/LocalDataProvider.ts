import { DataProvider, Transaction, Budget, Vendor, Category, Account } from '../types/dataProvider';
import { db } from '@/lib/dexieDB';
import { v4 as uuidv4 } from 'uuid';

export class LocalDataProvider implements DataProvider {
  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    // In local-first single-user mode, we might ignore userId, but for compatibility we can filter.
    // If we drop auth, userId might be null or fixed.
    if (userId) {
      return await db.transactions.where('user_id').equals(userId).reverse().sortBy('date');
    }
    return await db.transactions.orderBy('date').reverse().toArray();
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    await db.transactions.add(newTransaction);
    return newTransaction;
  }

  async updateTransaction(transaction: Transaction): Promise<void> {
    await db.transactions.put(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.transactions.delete(id);
  }

  async deleteTransactionByTransferId(transferId: string): Promise<void> {
    const transactionsToDelete = await db.transactions.where('transfer_id').equals(transferId).toArray();
    await db.transactions.bulkDelete(transactionsToDelete.map(t => t.id));
  }

  // Payees/Vendors/Accounts
  async ensurePayeeExists(name: string, isAccount: boolean, options?: { currency?: string; startingBalance?: number; remarks?: string }): Promise<string | null> {
    if (!name) return null;

    let vendor = await db.vendors.where('name').equals(name).first();

    if (vendor) {
      if (isAccount) {
        // Ensure it's an account
        let accountId = vendor.account_id;

        if (!accountId) {
          // Create account entry
          accountId = uuidv4();
          await db.accounts.add({
            id: accountId,
            currency: options?.currency || 'USD',
            starting_balance: options?.startingBalance || 0,
            remarks: options?.remarks || `Auto-created account for vendor: ${name}`,
            created_at: new Date().toISOString()
          });

          // Update vendor
          await db.vendors.update(vendor.id, { is_account: true, account_id: accountId });
        } else {
          // Ensure account exists (data integrity)
          const account = await db.accounts.get(accountId);
          if (!account) {
            await db.accounts.add({
              id: accountId,
              currency: options?.currency || 'USD',
              starting_balance: options?.startingBalance || 0,
              remarks: options?.remarks || `Auto-created account for vendor: ${name}`,
              created_at: new Date().toISOString()
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
          currency: options?.currency || 'USD',
          starting_balance: options?.startingBalance || 0,
          remarks: options?.remarks || `Auto-created account for vendor: ${name}`,
          created_at: new Date().toISOString()
        });
      }

      const newVendorId = uuidv4();
      await db.vendors.add({
        id: newVendorId,
        name: name,
        is_account: isAccount,
        account_id: accountId
      });
      return newVendorId;
    }
  }

  async checkIfPayeeIsAccount(name: string): Promise<boolean> {
    const vendor = await db.vendors.where('name').equals(name).first();
    return vendor?.is_account || false;
  }

  async getAccountCurrency(accountName: string): Promise<string> {
    const vendor = await db.vendors.where('name').equals(accountName).first();
    if (vendor && vendor.account_id) {
      const account = await db.accounts.get(vendor.account_id);
      return account?.currency || 'USD';
    }
    return 'USD';
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await db.vendors.toArray();
  }

  async mergePayees(targetName: string, sourceNames: string[]): Promise<void> {
    await db.transaction('rw', db.transactions, db.vendors, db.accounts, async () => {
        // 1. Update Transactions
        // Find transactions where account is in sourceNames
        await db.transactions.where('account').anyOf(sourceNames).modify({ account: targetName });

        // Find transactions where vendor is in sourceNames
        await db.transactions.where('vendor').anyOf(sourceNames).modify({ vendor: targetName });

        // 2. Delete source vendors/accounts
        // Get IDs of source vendors to delete accounts if linked
        const sourceVendors = await db.vendors.where('name').anyOf(sourceNames).toArray();
        const accountIdsToDelete = sourceVendors.map(v => v.account_id).filter(id => id != null) as string[];

        // Delete from vendors
        await db.vendors.where('name').anyOf(sourceNames).delete();

        // Delete from accounts
        if (accountIdsToDelete.length > 0) {
            await db.accounts.bulkDelete(accountIdsToDelete);
        }
    });
  }

  async deletePayee(id: string): Promise<void> {
      await db.vendors.delete(id);
      // We might want to delete linked account if is_account is true?
      // For now, simple delete as per request.
  async getAllAccounts(): Promise<Account[]> {
    return await db.accounts.toArray();
  }

  // Categories
  async ensureCategoryExists(name: string, userId: string): Promise<string | null> {
    if (!name) return null;
    const category = await db.categories.where('name').equals(name).first(); // We ignore userId check for local simplicity or add .and(c => c.user_id === userId)

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

  async ensureSubCategoryExists(name: string, categoryId: string, userId: string): Promise<string | null> {
    if (!name || !categoryId) return null;

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
    // In local mode, assuming single user or filtered
    if (userId) {
      return await db.categories.where('user_id').equals(userId).sortBy('name');
    }
    return await db.categories.orderBy('name').toArray();
  }

  async mergeCategories(targetName: string, sourceNames: string[]): Promise<void> {
      await db.transaction('rw', db.transactions, db.categories, db.sub_categories, db.budgets, async () => {
          // 1. Update Transactions
          await db.transactions.where('category').anyOf(sourceNames).modify({ category: targetName });

          // 2. Update Budgets?
          // If a budget is set for a merged category, we should probably update it too or delete duplicate budgets?
          // For simplicity, we update the name.
          await db.budgets.where('category_name').anyOf(sourceNames).modify({ category_name: targetName });

          // 3. Move Sub-categories?
          // Sub-categories are linked to category_id. We need to move them to the target category's ID.
          const targetCategory = await db.categories.where('name').equals(targetName).first();
          if (targetCategory) {
              const sourceCategories = await db.categories.where('name').anyOf(sourceNames).toArray();
              const sourceIds = sourceCategories.map(c => c.id);

              // Move sub-categories
              await db.sub_categories.where('category_id').anyOf(sourceIds).modify({ category_id: targetCategory.id });
          }

          // 4. Delete source categories
          await db.categories.where('name').anyOf(sourceNames).delete();
      });
  }

  async deleteCategory(id: string): Promise<void> {
      await db.categories.delete(id);
  }

  // Budgets
  async getBudgetsWithSpending(userId: string): Promise<Budget[]> {
    // Replicating RPC 'get_budgets_with_spending'
    const budgets = userId
      ? await db.budgets.where('user_id').equals(userId).toArray()
      : await db.budgets.toArray();

    const budgetsWithSpending: Budget[] = [];

    for (const budget of budgets) {
      // Calculate spending
      let spending = 0;

      // Define range
      const startDate = new Date(budget.start_date);
      // let endDate = budget.end_date ? new Date(budget.end_date) : new Date();

      // If no explicit end date, determine based on frequency relative to 'now' logic?
      // Supabase logic was likely "spending within current period" or "total spending in range".
      // Let's assume the budget defines the period strictly.
      // If end_date is null, it might be open-ended, so we sum everything after start_date.

      // Filter transactions
      // Optimization: querying all transactions and filtering in memory for now.
      // For better perf, use compound index [category+date] if possible.
      const transactions = await db.transactions
        .where('date')
        .aboveOrEqual(budget.start_date)
        .and(t => {
          if (budget.end_date && t.date > budget.end_date) return false;
          if (t.category !== budget.category_name) return false;
          if (budget.sub_category_name && t.sub_category !== budget.sub_category_name) return false;
          if (t.user_id !== userId && userId) return false; // Safety check
          return true;
        })
        .toArray();

      // Sum amount. Expenses are negative, so we need to ABS or handle sign.
      // Usually, budget is positive, expenses are negative.
      // "Spent amount" implies positive number representing outflow.
      const total = transactions.reduce((acc, t) => {
        // If expense (negative), add absolute value. If income (positive), subtract?
        // Or typically budgets track expenses.
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
      spent_amount: 0 // Initial
    });
  }

  async updateBudget(budget: Budget): Promise<void> {
    // We don't store spent_amount, it's derived. But we update the rest.
    const { spent_amount, ...storedBudget } = budget;
    await db.budgets.put(storedBudget as Budget); // Cast to Budget but Dexie ignores extra fields if not in store definition usually, but strict TS might complain.
    // Actually Dexie stores object as is. We should probably not store spent_amount if we compute it.
    // But updateBudget receives the full object.
    // Let's ensure we put what matches the interface minus derived.
    // Or just put it, it doesn't hurt to cache it, but we overwrite it on read.
    await db.budgets.put(budget);
  }

  async deleteBudget(id: string): Promise<void> {
    await db.budgets.delete(id);
  }

  // Maintenance
  async clearAllData(): Promise<void> {
    await db.transaction('rw', [db.transactions, db.budgets, db.vendors, db.accounts, db.categories, db.sub_categories], async () => {
      await db.transactions.clear();
      await db.budgets.clear();
      await db.vendors.clear();
      await db.accounts.clear();
      await db.categories.clear();
      await db.sub_categories.clear();
    });
  }

  // Migration Utils
  async exportData(): Promise<any> {
    const data = {
      transactions: await db.transactions.toArray(),
      budgets: await db.budgets.toArray(),
      vendors: await db.vendors.toArray(),
      accounts: await db.accounts.toArray(),
      categories: await db.categories.toArray(),
      sub_categories: await db.sub_categories.toArray(),
      version: 1,
      exportedAt: new Date().toISOString()
    };
    return data;
  }

  async importData(data: any): Promise<void> {
    if (!data || !data.transactions) throw new Error("Invalid data format");

    await db.transaction('rw', [db.transactions, db.budgets, db.vendors, db.accounts, db.categories, db.sub_categories], async () => {
      await db.transactions.clear();
      await db.budgets.clear();
      await db.vendors.clear();
      await db.accounts.clear();
      await db.categories.clear();
      await db.sub_categories.clear();

      if (data.transactions) await db.transactions.bulkAdd(data.transactions);
      if (data.budgets) await db.budgets.bulkAdd(data.budgets);
      if (data.vendors) await db.vendors.bulkAdd(data.vendors);
      if (data.accounts) await db.accounts.bulkAdd(data.accounts);
      if (data.categories) await db.categories.bulkAdd(data.categories);
      if (data.sub_categories) await db.sub_categories.bulkAdd(data.sub_categories);
    });
  }
}
