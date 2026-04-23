import { describe, it, expect, vi } from "vitest";
import { generateDiverseDemoData } from "./demoDataGenerator";
import { DataProvider } from "@/types/dataProvider";

function createMockProvider(): DataProvider {
  let ledgerCounter = 0;
  const ledgers: { id: string; name: string }[] = [];

  return {
    getLedgers: vi.fn().mockResolvedValue([]),
    addLedger: vi.fn().mockImplementation(async (ledger) => {
      const id = `ledger-${++ledgerCounter}`;
      ledgers.push({ id, name: ledger.name });
      return {
        ...ledger,
        id,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      };
    }),
    updateLedger: vi.fn().mockResolvedValue(undefined),
    deleteLedger: vi.fn().mockResolvedValue(undefined),
    getTransactions: vi.fn().mockResolvedValue([]),
    addTransaction: vi.fn().mockResolvedValue({}),
    addMultipleTransactions: vi.fn().mockResolvedValue([]),
    updateTransaction: vi.fn().mockResolvedValue(undefined),
    deleteTransaction: vi.fn().mockResolvedValue(undefined),
    deleteMultipleTransactions: vi.fn().mockResolvedValue(undefined),
    deleteTransactionByTransferId: vi.fn().mockResolvedValue(undefined),
    clearTransactions: vi.fn().mockResolvedValue(undefined),
    clearBudgets: vi.fn().mockResolvedValue(undefined),
    clearScheduledTransactions: vi.fn().mockResolvedValue(undefined),
    getScheduledTransactions: vi.fn().mockResolvedValue([]),
    addScheduledTransaction: vi.fn().mockResolvedValue({}),
    updateScheduledTransaction: vi.fn().mockResolvedValue(undefined),
    deleteScheduledTransaction: vi.fn().mockResolvedValue(undefined),
    deleteMultipleScheduledTransactions: vi.fn().mockResolvedValue(undefined),
    ensurePayeeExists: vi.fn().mockResolvedValue("payee-id"),
    checkIfPayeeIsAccount: vi.fn().mockResolvedValue(false),
    getAccountCurrency: vi.fn().mockResolvedValue("USD"),
    getAllVendors: vi.fn().mockResolvedValue([]),
    getVendorByName: vi.fn().mockResolvedValue(undefined),
    mergePayees: vi.fn().mockResolvedValue(undefined),
    deletePayee: vi.fn().mockResolvedValue(undefined),
    getAllAccounts: vi.fn().mockResolvedValue([]),
    ensureCategoryExists: vi.fn().mockResolvedValue("cat-id"),
    ensureSubCategoryExists: vi.fn().mockResolvedValue("sub-cat-id"),
    getUserCategories: vi.fn().mockResolvedValue([]),
    getSubCategories: vi.fn().mockResolvedValue([]),
    mergeCategories: vi.fn().mockResolvedValue(undefined),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
    getBudgetsWithSpending: vi.fn().mockResolvedValue([]),
    addBudget: vi.fn().mockResolvedValue(undefined),
    updateBudget: vi.fn().mockResolvedValue(undefined),
    deleteBudget: vi.fn().mockResolvedValue(undefined),
    linkTransactionsAsTransfer: vi.fn().mockResolvedValue(undefined),
    unlinkTransactions: vi.fn().mockResolvedValue(undefined),
    clearAllData: vi.fn().mockResolvedValue(undefined),
    exportData: vi.fn().mockResolvedValue({}),
    importData: vi.fn().mockResolvedValue(undefined),
    getAIProviders: vi.fn().mockResolvedValue([]),
    addAIProvider: vi.fn().mockResolvedValue({}),
    updateAIProvider: vi.fn().mockResolvedValue(undefined),
    deleteAIProvider: vi.fn().mockResolvedValue(undefined),
    setDefaultAIProvider: vi.fn().mockResolvedValue(undefined),
  } as unknown as DataProvider;
}

describe("generateDiverseDemoData", () => {
  it("creates richer note diversity in generated transactions", async () => {
    const provider = createMockProvider();

    await generateDiverseDemoData(provider, () => undefined);

    const addMany = vi.mocked(provider.addMultipleTransactions);
    const allBatches = addMany.mock.calls.map((call) => call[0]);
    const allTransactions = allBatches.flat();

    const nonEmptyRemarks = allTransactions
      .map((tx) => tx.remarks)
      .filter((v): v is string => !!v && v.trim().length > 0);

    const uniqueRemarks = new Set(nonEmptyRemarks);
    expect(uniqueRemarks.size).toBeGreaterThanOrEqual(5);
  });

  it("covers at least three years for each generated ledger", async () => {
    const provider = createMockProvider();
    await generateDiverseDemoData(provider, () => undefined);

    const addMany = vi.mocked(provider.addMultipleTransactions);
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    // Demo data saves transactions in multiple IndexedDB chunks per ledger.
    expect(addMany.mock.calls.length).toBeGreaterThanOrEqual(3);

    const allTransactions = addMany.mock.calls.map(([batch]) => batch).flat();
    const oldest = allTransactions.reduce((min, tx) => {
      const d = new Date(tx.date);
      return d < min ? d : min;
    }, new Date());

    expect(oldest.getTime()).toBeLessThanOrEqual(threeYearsAgo.getTime());
  });

  it("keeps recent months denser than older windows", async () => {
    const provider = createMockProvider();
    await generateDiverseDemoData(provider, () => undefined);

    const addMany = vi.mocked(provider.addMultipleTransactions);
    const allTransactions = addMany.mock.calls.map(([batch]) => batch).flat();

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const recentCutoff = now - 120 * msInDay; // ~4 months
    const oldWindowStart = now - 3 * 365 * msInDay;
    const oldWindowEnd = now - 2 * 365 * msInDay;

    const recentCount = allTransactions.filter(
      (tx) => new Date(tx.date).getTime() >= recentCutoff,
    ).length;

    const olderYearCount = allTransactions.filter((tx) => {
      const t = new Date(tx.date).getTime();
      return t >= oldWindowStart && t < oldWindowEnd;
    }).length;

    expect(recentCount).toBeGreaterThan(olderYearCount);
  });
});
