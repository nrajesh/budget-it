import { describe, it, expect, beforeEach } from 'vitest';
import { LocalDataProvider } from '@/providers/LocalDataProvider';
import { db } from '@/lib/dexieDB';


describe('Performance Benchmark', () => {
  const dataProvider = new LocalDataProvider();
  const TRANSACTION_COUNT = 1000;
  const LEDGER_ID = 'perf-ledger';

  beforeEach(async () => {
    await db.delete();
    await db.open();
    await dataProvider.addLedger({ name: 'Perf Ledger', currency: 'USD' });
  });

  const generateTransactions = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
      user_id: LEDGER_ID,
      date: new Date().toISOString(),
      amount: 10 + i,
      currency: 'USD',
      account: 'Checking',
      vendor: `Vendor ${i % 10}`,
      category: `Category ${i % 5}`,
      sub_category: `SubCategory ${i % 5}`,
      remarks: `Benchmark transaction ${i}`,
    }));
  };

  it('Baseline: Loop Insert', async () => {
    const transactions = generateTransactions(TRANSACTION_COUNT);

    // Pre-create account/vendor/category to match the real scenario where they likely exist
    // or let addTransaction do it (which is part of the overhead).
    // In useTransactionCSV, we ensure they exist BEFORE the loop.
    // So to be accurate, we should ensure they exist here too.

    await dataProvider.ensurePayeeExists('Checking', true, LEDGER_ID, { currency: 'USD' });
    for (let i = 0; i < 10; i++) {
      await dataProvider.ensurePayeeExists(`Vendor ${i}`, false, LEDGER_ID);
    }
    for (let i = 0; i < 5; i++) {
      const catId = await dataProvider.ensureCategoryExists(`Category ${i}`, LEDGER_ID);
      if (catId) {
        await dataProvider.ensureSubCategoryExists(`SubCategory ${i}`, catId, LEDGER_ID);
      }
    }

    const start = performance.now();

    let insertedCount = 0;
    for (const t of transactions) {
      await dataProvider.addTransaction(t);
      insertedCount++;
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`\n\n[Baseline] Loop Insert ${TRANSACTION_COUNT} items: ${duration.toFixed(2)}ms\n\n`);
    expect(insertedCount).toBe(TRANSACTION_COUNT);
  });

  it('Optimized: Bulk Insert', async () => {
    const transactions = generateTransactions(TRANSACTION_COUNT);

    // Even though bulk insert skips checks, we should ensure dependencies exist for data integrity,
    // just like the real CSV import does before calling bulk add.
    // This overhead is NOT part of the insertion function measurement, but it WAS part of the total time in the real app.
    // However, here we are measuring the insertion step specifically.

    await dataProvider.ensurePayeeExists('Checking', true, LEDGER_ID, { currency: 'USD' });
    for (let i = 0; i < 10; i++) {
      await dataProvider.ensurePayeeExists(`Vendor ${i}`, false, LEDGER_ID);
    }
    for (let i = 0; i < 5; i++) {
      const catId = await dataProvider.ensureCategoryExists(`Category ${i}`, LEDGER_ID);
      if (catId) {
        await dataProvider.ensureSubCategoryExists(`SubCategory ${i}`, catId, LEDGER_ID);
      }
    }

    const start = performance.now();

    const inserted = await dataProvider.addMultipleTransactions(transactions);

    const end = performance.now();
    const duration = end - start;

    console.log(`\n\n[Optimized] Bulk Insert ${TRANSACTION_COUNT} items: ${duration.toFixed(2)}ms\n\n`);
    expect(inserted.length).toBe(TRANSACTION_COUNT);
  });
});
