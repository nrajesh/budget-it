import { Transaction } from "@/data/finance-data";

export const calculateAccountStats = (transactions: Transaction[]) => {
  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);

  const balances = new Map<string, number>();
  const sourceCounts = new Map<string, number>(); // Key: Normalized Account Name
  const vendorCounts = new Map<string, number>(); // Key: Raw Vendor Name

  for (const t of transactions) {
    const tDate = (t.date || "").substring(0, 10);
    const tAccountRaw = t.account || "";
    const tAccount = tAccountRaw.trim().toLowerCase();
    const tVendor = t.vendor || "";

    // 1. Balance Calculation (only if date <= today)
    if (tDate <= todayStr) {
      const currentBalance = balances.get(tAccount) || 0;
      balances.set(tAccount, currentBalance + t.amount);

      // Source Count (only if date <= today)
      const currentCount = sourceCounts.get(tAccount) || 0;
      sourceCounts.set(tAccount, currentCount + 1);
    }

    // 2. Vendor Count (Transfer Destination)
    if (tVendor && tAccountRaw !== tVendor) {
      const currentVendorCount = vendorCounts.get(tVendor) || 0;
      vendorCounts.set(tVendor, currentVendorCount + 1);
    }
  }

  return { balances, sourceCounts, vendorCounts };
};
