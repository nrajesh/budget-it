import { describe, it, expect, beforeEach } from 'vitest';
import { LocalDataProvider } from '../providers/LocalDataProvider';
import { db } from '../lib/dexieDB';
import { v4 as uuidv4 } from 'uuid';

describe('Unlink Transactions Optimization Benchmark', () => {
  const dataProvider = new LocalDataProvider();
  const TRANSACTION_COUNT = 1000;
  const LEDGER_ID = 'perf-ledger';

  beforeEach(async () => {
    await db.delete();
    await db.open();
    // Ensure we have a ledger to satisfy any constraints, though not strictly required by this test
    await db.ledgers.put({ id: LEDGER_ID, name: 'Perf Ledger', currency: 'USD', created_at: new Date().toISOString(), last_accessed: new Date().toISOString() });
  });

  const generateTransactions = (count: number, transferId: string) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: uuidv4(),
      user_id: LEDGER_ID,
      date: new Date().toISOString(),
      amount: 10 + i,
      currency: 'USD',
      account: 'Checking',
      vendor: `Vendor ${i % 10}`,
      category: `Category ${i % 5}`,
      sub_category: `SubCategory ${i % 5}`,
      remarks: `Benchmark transaction ${i}`,
      transfer_id: transferId, created_at: new Date().toISOString(),
    }));
  };

  it('Baseline: Inefficient Loop Unlink', async () => {
    const TRANSFER_ID = uuidv4();
    const transactions = generateTransactions(TRANSACTION_COUNT, TRANSFER_ID);
    await db.transactions.bulkAdd(transactions);

    console.log(`[Baseline] Setup complete. Starting unlink of ${TRANSACTION_COUNT} items...`);
    const start = performance.now();

    // Simulate the inefficient implementation
    await db.transaction('rw', db.transactions, async () => {
      const txs = await db.transactions.where('transfer_id').equals(TRANSFER_ID).toArray();
      for (const t of txs) {
        await db.transactions.update(t.id, { transfer_id: null });
      }
    });

    const end = performance.now();
    console.log(`[Baseline] Loop Unlink (${TRANSACTION_COUNT} items): ${(end - start).toFixed(2)}ms`);

    // Verify
    const count = await db.transactions.where('transfer_id').equals(TRANSFER_ID).count();
    expect(count).toBe(0);
  }, 120000); // Increased timeout for slower environments

  it('Optimized: Bulk Modify Unlink', async () => {
    const TRANSFER_ID = uuidv4();
    const transactions = generateTransactions(TRANSACTION_COUNT, TRANSFER_ID);
    await db.transactions.bulkAdd(transactions);

    console.log(`[Optimized] Setup complete. Starting unlink of ${TRANSACTION_COUNT} items...`);
    const start = performance.now();

    // Use the actual optimized implementation
    await dataProvider.unlinkTransactions(TRANSFER_ID);

    const end = performance.now();
    console.log(`[Optimized] Modify Unlink (${TRANSACTION_COUNT} items): ${(end - start).toFixed(2)}ms`);

    // Verify
    const count = await db.transactions.where('transfer_id').equals(TRANSFER_ID).count();
    expect(count).toBe(0);
  }, 120000);
});
