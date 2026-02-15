import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/utils';
import { Transaction } from '@/data/finance-data';

// Mock data generator
const generateTransactions = (count: number): Transaction[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `tx-${i}`,
    date: new Date(Date.now() - i * 86400000).toISOString(), // YYYY-MM-DDTHH:mm:ss.sssZ
    amount: Math.random() * 100,
    category: `Category ${i % 5}`, // 5 categories
    account: 'Account 1',
    vendor: 'Vendor 1',
    currency: 'USD',
    created_at: new Date().toISOString(),
    user_id: 'user-1',
  }));
};

const sortDesc = (a: Transaction, b: Transaction) => {
  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (dateDiff !== 0) return dateDiff;
  return b.id.localeCompare(a.id);
};

const sortDescOptimized = (a: Transaction, b: Transaction) => {
  // ISO string comparison is equivalent to Date comparison
  if (b.date !== a.date) {
    return b.date > a.date ? 1 : -1;
  }
  return b.id.localeCompare(a.id);
};

describe('RecentTransactions Performance', () => {
  const COUNT = 10000;
  const transactions = generateTransactions(COUNT);
  const selectedCategories = ['category-1', 'category-3']; // slugs

  it('Sort Performance: new Date() vs String Compare', () => {
    // Shuffle roughly to ensure sort has work to do
    const tx1 = [...transactions].sort(() => Math.random() - 0.5);
    const tx2 = [...tx1];

    const start1 = performance.now();
    tx1.sort(sortDesc);
    const end1 = performance.now();

    const start2 = performance.now();
    tx2.sort(sortDescOptimized);
    const end2 = performance.now();

    // eslint-disable-next-line no-console
    console.log(`Sort (new Date): ${(end1 - start1).toFixed(4)}ms`);
    // eslint-disable-next-line no-console
    console.log(`Sort (String): ${(end2 - start2).toFixed(4)}ms`);

    expect(tx1.map((t) => t.id)).toEqual(tx2.map((t) => t.id));
  });

  it("Filter Performance: Slugify in Loop vs Pre-calc", () => {
    // Baseline: Slugify in loop (simulates what happens on EVERY filter change)
    const start1 = performance.now();
    // Simulate 10 filter interactions
    for (let i = 0; i < 10; i++) {
      transactions.filter((t) =>
        selectedCategories.includes(slugify(t.category)),
      );
    }
    const end1 = performance.now();

    // Optimized: Pre-calc (happens once on data load)
    const startPre = performance.now();
    const withSlugs = transactions.map((t) => ({
      ...t,
      categorySlug: slugify(t.category),
    }));
    const endPre = performance.now();

    // Optimized: Filter using pre-calc (simulates 10 filter interactions)
    const start2 = performance.now();
    for (let i = 0; i < 10; i++) {
      withSlugs.filter((t) => selectedCategories.includes(t.categorySlug));
    }
    const end2 = performance.now();

    // eslint-disable-next-line no-console
    console.log(
      `Filter 10x (Slugify in loop): ${(end1 - start1).toFixed(4)}ms`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `Filter 10x (Pre-calc filter only): ${(end2 - start2).toFixed(4)}ms`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `Pre-calc Overhead (Once): ${(endPre - startPre).toFixed(4)}ms`,
    );

    // Total time for 10 interactions:
    // Baseline: 10 * Loop
    // Optimized: 1 * Overhead + 10 * FastLoop

    const totalBaseline = end1 - start1;
    const totalOptimized = endPre - startPre + (end2 - start2);

    // eslint-disable-next-line no-console
    console.log(
      `Total Work (10 interactions): Baseline=${totalBaseline.toFixed(2)}ms vs Optimized=${totalOptimized.toFixed(2)}ms`,
    );
  });
});
