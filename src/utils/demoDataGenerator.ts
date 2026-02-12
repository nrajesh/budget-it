import {
  DataProvider,
  Budget,
  Transaction,
  Ledger,
} from "@/types/dataProvider";

export interface ProgressCallback {
  (progress: { stage: string; progress: number; totalStages: number }): void;
}

const DEMO_BUDGETS: {
  category?: string;
  sub?: string;
  amount: number;
  frequency: string;
  budget_scope?: "category" | "account" | "vendor";
  budget_scope_name?: string;
  is_goal?: boolean;
  goal_context?: string;
}[] = [
    // Category-level spending budgets
    { category: "Groceries", amount: 800, frequency: "Monthly" },
    { category: "Dining Out", sub: "Coffee", amount: 120, frequency: "Monthly" },
    { category: "Entertainment", amount: 200, frequency: "Monthly" },
    { category: "Transport", sub: "Fuel", amount: 250, frequency: "Monthly" },
    { category: "Shopping", amount: 300, frequency: "Monthly" },
    { category: "Pets", amount: 100, frequency: "Monthly" },
    { category: "Personal Care", amount: 150, frequency: "Monthly" },
    { category: "Education", amount: 500, frequency: "Yearly" },
    { category: "Utilities", amount: 400, frequency: "Monthly" },
    { category: "Health", amount: 300, frequency: "Monthly" },
    {
      category: "Dining Out",
      sub: "Restaurants",
      amount: 400,
      frequency: "Monthly",
    },
    { category: "Home Services", amount: 200, frequency: "Monthly" },
    {
      category: "Transport",
      sub: "Public Transport",
      amount: 100,
      frequency: "Monthly",
    },
    {
      category: "Shopping",
      sub: "Electronics",
      amount: 1000,
      frequency: "Yearly",
    },
    { category: "Shopping", sub: "Clothing", amount: 200, frequency: "Monthly" },
    { category: "Housing", sub: "Rent", amount: 1500, frequency: "Monthly" },
    // Account-level spending budgets
    { amount: 2000, frequency: "Monthly", budget_scope: "account", budget_scope_name: "__ACCOUNT_0__" },
    { amount: 500, frequency: "Monthly", budget_scope: "account", budget_scope_name: "__ACCOUNT_1__" },
    // Vendor-level spending budgets
    { amount: 50, frequency: "Monthly", budget_scope: "vendor", budget_scope_name: "Netflix" },
    { amount: 200, frequency: "Monthly", budget_scope: "vendor", budget_scope_name: "Employer" },
    // Savings goals
    { category: "Groceries", amount: 5000, frequency: "Monthly", is_goal: true, goal_context: "Groceries" },
    { amount: 10000, frequency: "Monthly", budget_scope: "account", budget_scope_name: "__ACCOUNT_1__", is_goal: true, goal_context: "__ACCOUNT_1__" },
  ];

interface DemoScheduledTransaction {
  accountType: string;
  vendor: string;
  category: string;
  sub_category?: string;
  amount: number;
  frequency: string;
  remarks: string;
  isTransfer?: boolean;
  next_date_offset?: number;
}

// Template for scheduled transactions for HOME budget
const HOME_SCHEDULED_TRANSACTIONS: DemoScheduledTransaction[] = [
  {
    accountType: "Checking",
    vendor: "Landlord",
    category: "Housing",
    sub_category: "Rent",
    amount: -1200,
    frequency: "Monthly",
    remarks: "Rent Payment",
  },
  {
    accountType: "Credit Card",
    vendor: "Netflix",
    category: "Entertainment",
    sub_category: "Streaming",
    amount: -15.99,
    frequency: "Monthly",
    remarks: "Netflix Subscription",
  },
  {
    accountType: "Checking",
    vendor: "Savings",
    category: "Transfer",
    amount: -500,
    frequency: "Monthly",
    remarks: "Monthly Savings Transfer",
    isTransfer: true,
  },
  {
    accountType: "Checking",
    vendor: "IRS",
    category: "Health",
    sub_category: "Insurance",
    amount: -15000,
    frequency: "Yearly",
    remarks: "Tax Payment",
    next_date_offset: 2,
  },
  {
    accountType: "Credit Card",
    vendor: "Gym",
    category: "Health",
    sub_category: "Gym",
    amount: -29.99,
    frequency: "Monthly",
    remarks: "Gym Membership",
  },
  {
    accountType: "Checking",
    vendor: "Electric Company",
    category: "Utilities",
    sub_category: "Electricity",
    amount: -150,
    frequency: "Monthly",
    remarks: "Electricity Bill",
  },
  {
    accountType: "Checking",
    vendor: "Employer",
    category: "Income",
    sub_category: "Salary",
    amount: 4500,
    frequency: "Monthly",
    remarks: "Monthly Salary",
  },
];

// Template for CHILD budget
const CHILD_SCHEDULED_TRANSACTIONS: DemoScheduledTransaction[] = [
  {
    accountType: "Checking", // Allowance account
    vendor: "Spotify",
    category: "Entertainment",
    sub_category: "Streaming",
    amount: -9.99,
    frequency: "Monthly",
    remarks: "Music Subscription",
  },
  {
    accountType: "Checking",
    vendor: "Savings", // Junior Isa
    category: "Transfer",
    amount: -20,
    frequency: "Monthly",
    remarks: "Save for game console",
    isTransfer: true,
  },
  {
    accountType: "Checking",
    vendor: "Parents",
    category: "Income",
    sub_category: "Allowance",
    amount: 50,
    frequency: "Weekly",
    remarks: "Weekly Allowance",
  },
  {
    accountType: "Checking",
    vendor: "Cinema",
    category: "Entertainment",
    sub_category: "Movies",
    amount: -15,
    frequency: "Monthly",
    remarks: "Movie Night",
  },
  {
    accountType: "Checking",
    vendor: "Bookstore",
    category: "Education",
    sub_category: "Books",
    amount: -25,
    frequency: "Monthly",
    remarks: "Books",
  },
  {
    accountType: "Checking",
    vendor: "Online Course",
    category: "Education",
    sub_category: "Courses",
    amount: -10,
    frequency: "Monthly",
    remarks: "Coding Course",
  },
];

// Template for OFFSHORE budget
const OFFSHORE_SCHEDULED_TRANSACTIONS: DemoScheduledTransaction[] = [
  {
    accountType: "Checking", // Foreign Checking
    vendor: "Property Management",
    category: "Housing",
    sub_category: "Rent",
    amount: -250, // Maintenance fee?
    frequency: "Monthly",
    remarks: "Villa Maintenance",
  },
  {
    accountType: "Checking",
    vendor: "Offshore Savings",
    category: "Transfer",
    amount: -2000,
    frequency: "Quarterly",
    remarks: "Quarterly Profit Transfer",
    isTransfer: true,
  },
  {
    accountType: "Checking",
    vendor: "Tax Authority",
    category: "Legal",
    sub_category: "Taxes",
    amount: -500,
    frequency: "Yearly",
    remarks: "Property Tax",
  },
  {
    accountType: "Checking",
    vendor: "Cleaner",
    category: "Home Services",
    sub_category: "Cleaning",
    amount: -100,
    frequency: "Monthly",
    remarks: "Cleaning Service",
  },
  {
    accountType: "Checking",
    vendor: "Tenant",
    category: "Income",
    sub_category: "Rental",
    amount: 3000,
    frequency: "Monthly",
    remarks: "Rental Income",
  },
  {
    accountType: "Checking",
    vendor: "Utility Provider",
    category: "Utilities",
    sub_category: "Combined",
    amount: -200,
    frequency: "Monthly",
    remarks: "Utilities",
  },
];

// --- RANDOM DATA HELPERS ---
const CATEGORIES_CONFIG = {
  Groceries: ["Supermarket", "Organic Store", "Bakery", "Butcher", "Market"],
  "Dining Out": ["Restaurants", "Coffee", "Bars", "Fast Food", "Delivery"],
  Entertainment: ["Movies", "Games", "Streaming", "Concert", "Events"],
  Transport: ["Fuel", "Public Transport", "Taxi", "Parking", "Service"],
  Shopping: ["Clothing", "Electronics", "Home Goods", "Gifts", "Online"],
  Utilities: ["Electricity", "Water", "Internet", "Phone", "Gas"],
  Health: ["Pharmacy", "Doctor", "Dentist", "Gym", "Insurance"],
  "Home Services": ["Cleaning", "Repairs", "Garden", "Security", "Decor"],
  Education: ["Books", "Courses", "Tuition", "Supplies", "Software"],
  "Personal Care": ["Haircut", "Cosmetics", "Spa", "Gym", "Therapy"],
  Pets: ["Food", "Vet", "Toys", "Grooming", "Insurance"],
  Housing: ["Rent", "Mortgage", "Repairs", "Furniture", "Taxes"],
  Income: ["Salary", "Freelance", "Bonus", "Interest", "Refund"],
  Transfer: ["Transfer"],
};

const VENDOR_PREFIXES = [
  "The",
  "My",
  "Best",
  "Local",
  "City",
  "Online",
  "Daily",
];
const VENDOR_SUFFIXES = [
  "Store",
  "Shop",
  "Services",
  "Mart",
  "Hub",
  "Place",
  "Point",
  "Center",
];

function getRandomVendor(category: string, subCategory: string): string {
  if (category === "Income") return Math.random() > 0.7 ? "Client" : "Employer";
  if (subCategory && Math.random() > 0.5)
    return `${subCategory} ${VENDOR_SUFFIXES[Math.floor(Math.random() * VENDOR_SUFFIXES.length)]}`;
  const prefix =
    VENDOR_PREFIXES[Math.floor(Math.random() * VENDOR_PREFIXES.length)];
  const suffix =
    VENDOR_SUFFIXES[Math.floor(Math.random() * VENDOR_SUFFIXES.length)];
  return `${prefix} ${category} ${suffix}`;
}

function getRandomDate(): string {
  const isRecent = Math.random() > 0.3; // 70% chance of being recent (last 3 months)
  const now = new Date();
  let daysAgo;

  if (isRecent) {
    // Last 90 days
    daysAgo = Math.floor(Math.random() * 90);
  } else {
    // Last 2 years (approx 730 days)
    daysAgo = Math.floor(Math.random() * 730);
  }
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

export const generateDiverseDemoData = async (
  dataProvider: DataProvider,
  onProgress: ProgressCallback,
) => {
  const TOTAL_STAGES = 100;

  // 1. Clear ALL Data
  onProgress({
    stage: "Clearing existing data...",
    progress: 5,
    totalStages: TOTAL_STAGES,
  });
  await dataProvider.clearAllData();

  // 2. Create Ledgers
  onProgress({
    stage: "Creating Ledgers...",
    progress: 10,
    totalStages: TOTAL_STAGES,
  });

  const ledgersToCreate = [
    {
      name: "Home Budget",
      currency: "EUR",
      icon: "home",
      short_name: "Home",
      accounts: ["Joint Checking", "Savings", "Credit Card"],
      currencies: ["EUR", "GBP", "USD"],
      scheduledTransactions: HOME_SCHEDULED_TRANSACTIONS,
      budgetCount: 6,
    },
    {
      name: "Child Budget",
      currency: "EUR",
      icon: "baby",
      short_name: "Child",
      accounts: ["Allowance", "Pocket Money", "Junior Isa"],
      currencies: ["EUR", "EUR", "EUR"],
      scheduledTransactions: CHILD_SCHEDULED_TRANSACTIONS,
      budgetCount: 4,
    },
    {
      name: "Offshore",
      currency: "EUR",
      icon: "globe",
      short_name: "Off",
      accounts: ["Offshore Savings", "Foreign Checking"],
      currencies: ["INR", "EUR"],
      scheduledTransactions: OFFSHORE_SCHEDULED_TRANSACTIONS,
      budgetCount: 5,
    },
  ];

  const createdLedgers = [];

  for (const l of ledgersToCreate) {
    const newLedger = await dataProvider.addLedger({
      name: l.name,
      currency: l.currency,
      icon: l.icon,
      short_name: l.short_name,
    });
    createdLedgers.push({ ...newLedger, config: l });
  }

  // 3. Populate Data per Ledger
  const totalLedgers = createdLedgers.length;
  let currentLedgerIndex = 0;

  for (const ledgerItem of createdLedgers) {
    const ledger = ledgerItem as Ledger & { config: typeof ledgersToCreate[0] };
    const lId = ledger.id;
    const config = ledger.config;

    onProgress({
      stage: `Populating ${config.name}...`,
      progress: 10 + (currentLedgerIndex / totalLedgers) * 80,
      totalStages: TOTAL_STAGES,
    });

    // --- Create Accounts ---
    const accountMap = new Map<string, string>(); // Name -> Currency
    const createdAccountNames: string[] = [];

    // Pre-create accounts as they are needed for transactions
    for (let i = 0; i < config.accounts.length; i++) {
      const accName = config.accounts[i];
      const accCurr = config.currencies[i];

      await dataProvider.ensurePayeeExists(accName, true, lId, {
        currency: accCurr,
        startingBalance: Math.floor(Math.random() * 20000) + 5000, // Boost starting balance significantly
        type: accName.includes("Isa")
          ? "Investment"
          : accName.includes("Card")
            ? "Credit Card"
            : accName.includes("Savings")
              ? "Savings"
              : "Checking",
      });
      accountMap.set(accName, accCurr);
      createdAccountNames.push(accName);
    }

    // --- Create Categories ---
    const categoryMap = new Map<string, string>(); // Name -> ID
    const subCategoryMap = new Map<string, string[]>(); // Category -> SubCategories[]

    // Pre-create categories
    for (const [cat, subs] of Object.entries(CATEGORIES_CONFIG)) {
      const id = await dataProvider.ensureCategoryExists(cat, lId);
      if (id) {
        categoryMap.set(cat, id);
        subCategoryMap.set(cat, subs);
        // Create sub-categories
        for (const sub of subs) {
          await dataProvider.ensureSubCategoryExists(sub, id, lId);
        }
      }
    }

    // --- Create Budgets ---
    const shuffledBudgets = [...DEMO_BUDGETS].sort(() => 0.5 - Math.random());
    const selectedBudgets = shuffledBudgets.slice(0, config.budgetCount);

    for (const budget of selectedBudgets) {
      const scope = budget.budget_scope || "category";

      // Resolve __ACCOUNT_N__ placeholders to real account names
      let resolvedScopeName = budget.budget_scope_name || "";
      let resolvedGoalContext = budget.goal_context || "";
      const placeholderMatch = resolvedScopeName.match(/^__ACCOUNT_(\d+)__$/);
      if (placeholderMatch) {
        const idx = parseInt(placeholderMatch[1], 10);
        resolvedScopeName = createdAccountNames[idx % createdAccountNames.length] || createdAccountNames[0];
      }
      const goalPlaceholderMatch = resolvedGoalContext.match(/^__ACCOUNT_(\d+)__$/);
      if (goalPlaceholderMatch) {
        const idx = parseInt(goalPlaceholderMatch[1], 10);
        resolvedGoalContext = createdAccountNames[idx % createdAccountNames.length] || createdAccountNames[0];
      }

      // For category-scoped budgets, resolve category ID
      let catId = "";
      if (scope === "category") {
        catId = categoryMap.get(budget.category || "") || "";
        if (!catId) continue; // Skip if category doesn't exist
      }

      // Target date for goals: 6 months from now
      const targetDate = budget.is_goal
        ? new Date(new Date().getFullYear(), new Date().getMonth() + 6, 1).toISOString()
        : null;

      await dataProvider.addBudget({
        user_id: lId,
        category_id: catId,
        category_name: scope === "category" ? (budget.category || "") : resolvedScopeName,
        target_amount: budget.amount,
        currency: config.currency,
        start_date: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        end_date: null,
        frequency: budget.frequency as Budget["frequency"],
        sub_category_name: budget.sub,
        budget_scope: scope,
        budget_scope_name: scope !== "category" ? resolvedScopeName : undefined,
        is_goal: budget.is_goal || false,
        target_date: targetDate,
        goal_context: budget.is_goal ? resolvedGoalContext : undefined,
      });
    }

    // --- Create Scheduled Transactions ---
    const scheduledTransactions = config.scheduledTransactions || [];
    for (const sched of scheduledTransactions) {
      let accountName = createdAccountNames.find((n) => {
        const lowerN = n.toLowerCase();
        if (sched.accountType === "Checking")
          return (
            lowerN.includes("checking") ||
            lowerN.includes("allowance") ||
            lowerN.includes("foreign")
          );
        if (sched.accountType === "Credit Card") return lowerN.includes("card");
        if (sched.accountType === "Savings")
          return (
            lowerN.includes("savings") ||
            lowerN.includes("isa") ||
            lowerN.includes("pocket")
          );
        return false;
      });
      if (!accountName) accountName = createdAccountNames[0];

      let vendorName = sched.vendor;
      if (sched.isTransfer) {
        const targetAcc = createdAccountNames.find(
          (n) =>
            n !== accountName &&
            (n.includes("Savings") ||
              n.includes("Checking") ||
              n.includes("Pocket")),
        );
        if (targetAcc) vendorName = targetAcc;
        else
          vendorName =
            createdAccountNames.find((n) => n !== accountName) ||
            "Unknown Account";
      } else if (sched.category === "Income") {
        vendorName = sched.vendor;
      }

      const schedDate = new Date();
      schedDate.setDate(schedDate.getDate() + (sched.next_date_offset || 1));

      if (!sched.isTransfer) {
        await dataProvider.ensurePayeeExists(vendorName, false, lId);
      }

      await dataProvider.addScheduledTransaction({
        user_id: lId,
        account: accountName,
        vendor: vendorName,
        category: sched.category,
        sub_category: sched.sub_category || null,
        amount: sched.amount,
        currency: accountMap.get(accountName) || "USD",
        date: schedDate.toISOString(),
        frequency: sched.frequency,
        remarks: sched.remarks,
      });

      if (sched.isTransfer) {
        await dataProvider.ensureCategoryExists("Transfer", lId);
        await dataProvider.addScheduledTransaction({
          user_id: lId,
          account: vendorName,
          vendor: accountName,
          category: "Transfer",
          sub_category: null,
          amount: -sched.amount,
          currency: accountMap.get(vendorName) || "USD",
          date: schedDate.toISOString(),
          frequency: sched.frequency,
          remarks: sched.remarks,
        });
      }
    }

    // --- GENERATE BULK TRANSACTIONS ---
    const numTransactions = 1000;
    const availableCategories = Object.keys(CATEGORIES_CONFIG).filter(
      (c) => c !== "Transfer",
    );
    const transactionsBatch: Omit<Transaction, "id" | "created_at">[] = [];
    const vendorsToEnsure = new Set<string>();

    // Generate phase (in-memory)
    onProgress({
      stage: `Generating ${numTransactions} transactions...`,
      progress: 10 + (currentLedgerIndex / totalLedgers) * 80 + 5,
      totalStages: TOTAL_STAGES,
    });

    for (let i = 0; i < numTransactions; i++) {
      const isTransfer = Math.random() < 0.08;
      const date = getRandomDate();

      // Boost Income Probability to ~20% (from ~8%) to ensure positive growth
      const isIncomeOverride = Math.random() < 0.2;

      if (isTransfer && createdAccountNames.length > 1 && !isIncomeOverride) {
        const acc1 =
          createdAccountNames[
          Math.floor(Math.random() * createdAccountNames.length)
          ];
        let acc2 =
          createdAccountNames[
          Math.floor(Math.random() * createdAccountNames.length)
          ];
        while (acc2 === acc1) {
          acc2 =
            createdAccountNames[
            Math.floor(Math.random() * createdAccountNames.length)
            ];
        }
        const amount = Math.floor(Math.random() * 500) + 10;

        // Transfer Pair
        transactionsBatch.push({
          user_id: lId,
          date: date,
          amount: -amount,
          currency: accountMap.get(acc1) || config.currency,
          account: acc1,
          vendor: acc2,
          category: "Transfer",
          remarks: "Demo Transfer",
        });
        transactionsBatch.push({
          user_id: lId,
          date: date,
          amount: amount,
          currency: accountMap.get(acc2) || config.currency,
          account: acc2,
          vendor: acc1,
          category: "Transfer",
          remarks: "Demo Transfer",
        });
        continue;
      }

      // Normal Tx
      let cat;
      if (isIncomeOverride) {
        cat = "Income";
      } else {
        // Pick random non-income category
        const expenses = availableCategories.filter((c) => c !== "Income");
        cat = expenses[Math.floor(Math.random() * expenses.length)];
      }

      const subs = subCategoryMap.get(cat) || [];
      const sub =
        subs.length > 0 ? subs[Math.floor(Math.random() * subs.length)] : null;
      const vendor = getRandomVendor(cat, sub || "");
      const account =
        createdAccountNames[
        Math.floor(Math.random() * createdAccountNames.length)
        ];
      const currency = accountMap.get(account) || config.currency;

      let amount = 0;
      if (cat === "Income") {
        // Boost income amount slightly
        amount = Math.floor(Math.random() * 4000) + 1500;
      } else {
        amount = -Math.floor(Math.random() * 200) - 5;
        if (cat === "Housing") amount = -Math.floor(Math.random() * 1000) - 500;
        if (cat === "Groceries") amount = -Math.floor(Math.random() * 150) - 10;
      }

      vendorsToEnsure.add(vendor);

      transactionsBatch.push({
        user_id: lId,
        date: date,
        amount: amount,
        currency: currency,
        account: account,
        vendor: vendor,
        category: cat,
        sub_category: sub,
        remarks: Math.random() > 0.8 ? "Special note" : "",
      });
    }

    // Bulk Ensure Entities (Vendors)
    // Note: ensurePayeeExists is singular, so we loop.
    // But since we have ~1000 transactions, we probably have ~50-100 vendors. This is fast.
    onProgress({
      stage: `Creating vendors...`,
      progress: 10 + (currentLedgerIndex / totalLedgers) * 80 + 10,
      totalStages: TOTAL_STAGES,
    });

    for (const vendorName of vendorsToEnsure) {
      await dataProvider.ensurePayeeExists(vendorName, false, lId);
    }

    // Bulk Insert Transactions
    onProgress({
      stage: `Inserting transactions...`,
      progress: 10 + (currentLedgerIndex / totalLedgers) * 80 + 15,
      totalStages: TOTAL_STAGES,
    });

    // DataProvider might not have addMultipleTransactions interface fully typed in all contexts,
    // but LocalDataProvider has it. Cast if necessary or assume DataProvider interface has it.
    // DataProvider interface guarantees addMultipleTransactions
    await dataProvider.addMultipleTransactions(transactionsBatch);

    currentLedgerIndex++;
  }

  onProgress({
    stage: "Finalizing...",
    progress: 100,
    totalStages: TOTAL_STAGES,
  });
  await new Promise((r) => setTimeout(r, 800));
};
