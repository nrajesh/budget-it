
import { describe, it, expect, vi } from 'vitest';

// Mock types
interface Transaction {
  id: string;
  category: string;
  sub_category?: string | null;
  // Other fields irrelevant for this benchmark
}

// function signature interfaces omitted since they are mock types


// Generate dummy transactions
const generateTransactions = (count: number, categoryCount: number): Transaction[] => {
  const txs: Transaction[] = [];
  const categories = Array.from({ length: categoryCount }, (_, i) => `Category ${i}`);

  for (let i = 0; i < count; i++) {
    const catIndex = Math.floor(Math.random() * categoryCount);
    txs.push({
      id: `tx-${i}`,
      category: categories[catIndex],
      sub_category: i % 2 === 0 ? `Sub ${categories[catIndex]}` : undefined
    });
  }
  return txs;
};

// Mock DataProvider with simulated delay
const createMockDataProvider = () => {
  return {
    ensureCategoryExists: vi.fn(async (name: string, _userId: string) => {
      await new Promise(resolve => setTimeout(resolve, 0)); // minimal async delay
      return `cat-id-${name}`;
    }),
    ensureSubCategoryExists: vi.fn(async (name: string, _catId: string, _userId: string) => {
      await new Promise(resolve => setTimeout(resolve, 0));
      return `sub-id-${name}`;
    })
  };
};

describe('Entity Sync Benchmark', () => {
  const TRANSACTION_COUNT = 5000;
  const CATEGORY_COUNT = 20;
  const transactions = generateTransactions(TRANSACTION_COUNT, CATEGORY_COUNT);
  const userId = 'user-123';

  it('measures N+1 approach vs Optimized approach', async () => {
    // --- N+1 Approach ---
    const providerN1 = createMockDataProvider();
    const startN1 = performance.now();

    for (const t of transactions) {
      if (t.category) {
        const catId = await providerN1.ensureCategoryExists(t.category, userId);
        if (catId && t.sub_category) {
          await providerN1.ensureSubCategoryExists(t.sub_category, catId, userId);
        }
      }
    }

    const endN1 = performance.now();
    const timeN1 = endN1 - startN1;
    console.log(`N+1 Approach Time: ${timeN1.toFixed(2)}ms`);
    console.log(`Calls: ensureCategoryExists=${providerN1.ensureCategoryExists.mock.calls.length}, ensureSubCategoryExists=${providerN1.ensureSubCategoryExists.mock.calls.length}`);


    // --- Optimized Approach ---
    const providerOpt = createMockDataProvider();
    const startOpt = performance.now();

    // Logic to be implemented in TransactionsContext
    const uniqueCategories = new Set<string>();
    const uniqueSubCategories = new Map<string, Set<string>>(); // category -> subCategories

    // 1. Collect unique
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

    // 2. Process Categories
    const categoryIdMap = new Map<string, string>();
    for (const cat of uniqueCategories) {
      const id = await providerOpt.ensureCategoryExists(cat, userId);
      if (id) categoryIdMap.set(cat, id);
    }

    // 3. Process SubCategories
    for (const [catName, subs] of uniqueSubCategories) {
      const catId = categoryIdMap.get(catName);
      if (catId) {
        for (const sub of subs) {
          await providerOpt.ensureSubCategoryExists(sub, catId, userId);
        }
      }
    }

    const endOpt = performance.now();
    const timeOpt = endOpt - startOpt;
    console.log(`Optimized Approach Time: ${timeOpt.toFixed(2)}ms`);
    console.log(`Calls: ensureCategoryExists=${providerOpt.ensureCategoryExists.mock.calls.length}, ensureSubCategoryExists=${providerOpt.ensureSubCategoryExists.mock.calls.length}`);

    // Assertions
    expect(timeOpt).toBeLessThan(timeN1);
    expect(providerOpt.ensureCategoryExists.mock.calls.length).toBeLessThanOrEqual(CATEGORY_COUNT);

  }, 30000); // 30s timeout
});
