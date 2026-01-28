import { DataProvider } from '@/types/dataProvider';

export interface ProgressCallback {
    (progress: { stage: string; progress: number; totalStages: number }): void;
}

const DEMO_BUDGETS = [
    { category: 'Groceries', amount: 800, frequency: 'Monthly' },
    { category: 'Dining Out', sub: 'Coffee', amount: 120, frequency: 'Monthly' },
    { category: 'Entertainment', amount: 200, frequency: 'Monthly' },
    { category: 'Transport', sub: 'Fuel', amount: 250, frequency: 'Monthly' },
    { category: 'Shopping', amount: 300, frequency: 'Monthly' },
    { category: 'Pets', amount: 100, frequency: 'Monthly' },
    { category: 'Personal Care', amount: 150, frequency: 'Monthly' },
    { category: 'Education', amount: 500, frequency: 'Yearly' },
    { category: 'Utilities', amount: 400, frequency: 'Monthly' },
    { category: 'Health', amount: 300, frequency: 'Monthly' },
    { category: 'Dining Out', sub: 'Restaurants', amount: 400, frequency: 'Monthly' },
    { category: 'Home Services', amount: 200, frequency: 'Monthly' },
    { category: 'Transport', sub: 'Public Transport', amount: 100, frequency: 'Monthly' },
    { category: 'Shopping', sub: 'Electronics', amount: 1000, frequency: 'Yearly' },
    { category: 'Shopping', sub: 'Clothing', amount: 200, frequency: 'Monthly' }
];

// Template for scheduled transactions.
// We will map 'Checking Account', 'Savings Vault', 'Credit Card' to actual accounts in the ledger.
// Template for scheduled transactions for HOME budget
const HOME_SCHEDULED_TRANSACTIONS = [
    {
        accountType: 'Checking',
        vendor: 'Landlord',
        category: 'Housing',
        sub_category: 'Rent',
        amount: -1200,
        frequency: 'Monthly',
        remarks: 'Rent Payment'
    },
    {
        accountType: 'Credit Card',
        vendor: 'Netflix',
        category: 'Entertainment',
        sub_category: 'Streaming',
        amount: -15.99,
        frequency: 'Monthly',
        remarks: 'Netflix Subscription'
    },
    {
        accountType: 'Checking',
        vendor: 'Savings',
        category: 'Transfer',
        amount: -500,
        frequency: 'Monthly',
        remarks: 'Monthly Savings Transfer',
        isTransfer: true
    },
    {
        accountType: 'Checking',
        vendor: 'IRS',
        category: 'Health',
        sub_category: 'Insurance',
        amount: -15000,
        frequency: 'Yearly',
        remarks: 'Tax Payment',
        next_date_offset: 2
    },
    {
        accountType: 'Credit Card',
        vendor: 'Gym',
        category: 'Health',
        sub_category: 'Gym',
        amount: -29.99,
        frequency: 'Monthly',
        remarks: 'Gym Membership'
    },
    {
        accountType: 'Checking',
        vendor: 'Electric Company',
        category: 'Utilities',
        sub_category: 'Electricity',
        amount: -150,
        frequency: 'Monthly',
        remarks: 'Electricity Bill'
    }
];

// Template for CHILD budget
const CHILD_SCHEDULED_TRANSACTIONS = [
    {
        accountType: 'Checking', // Allowance account
        vendor: 'Spotify',
        category: 'Entertainment',
        sub_category: 'Streaming',
        amount: -9.99,
        frequency: 'Monthly',
        remarks: 'Music Subscription'
    },
    {
        accountType: 'Checking',
        vendor: 'Savings', // Junior Isa
        category: 'Transfer',
        amount: -20,
        frequency: 'Monthly',
        remarks: 'Save for game console',
        isTransfer: true
    }
];

// Template for OFFSHORE budget
const OFFSHORE_SCHEDULED_TRANSACTIONS = [
    {
        accountType: 'Checking', // Foreign Checking
        vendor: 'Property Management',
        category: 'Housing',
        sub_category: 'Rent',
        amount: -250, // Maintenance fee?
        frequency: 'Monthly',
        remarks: 'Villa Maintenance'
    },
    {
        accountType: 'Checking',
        vendor: 'Offshore Savings',
        category: 'Transfer',
        amount: -2000,
        frequency: 'Quarterly',
        remarks: 'Quarterly Profit Transfer',
        isTransfer: true
    }
];

export const generateDiverseDemoData = async (
    dataProvider: DataProvider,
    onProgress: ProgressCallback
) => {
    const TOTAL_STAGES = 100;

    // 1. Clear ALL Data
    onProgress({ stage: 'Clearing existing data...', progress: 5, totalStages: TOTAL_STAGES });
    await dataProvider.clearAllData();

    // 2. Create Ledgers
    onProgress({ stage: 'Creating Ledgers...', progress: 10, totalStages: TOTAL_STAGES });

    const ledgersToCreate = [
        {
            name: 'Home Budget',
            currency: 'EUR',
            icon: 'home',
            short_name: 'Home',
            accounts: ['Joint Checking', 'Savings', 'Credit Card'],
            currencies: ['EUR', 'GBP', 'USD'],
            scheduledTransactions: HOME_SCHEDULED_TRANSACTIONS
        },
        {
            name: 'Child Budget',
            currency: 'EUR',
            icon: 'baby',
            short_name: 'Child',
            accounts: ['Allowance', 'Pocket Money', 'Junior Isa'],
            currencies: ['EUR', 'EUR', 'EUR'],
            scheduledTransactions: CHILD_SCHEDULED_TRANSACTIONS
        },
        {
            name: 'Offshore',
            currency: 'EUR',
            icon: 'globe',
            short_name: 'Off',
            accounts: ['Offshore Savings', 'Foreign Checking'],
            currencies: ['INR', 'EUR'],
            scheduledTransactions: OFFSHORE_SCHEDULED_TRANSACTIONS
        }
    ];

    const createdLedgers = [];

    for (const l of ledgersToCreate) {
        const newLedger = await dataProvider.addLedger({
            name: l.name,
            currency: l.currency,
            icon: l.icon,
            short_name: l.short_name
        });
        createdLedgers.push({ ...newLedger, config: l });
    }

    // 3. Populate Data per Ledger
    const totalLedgers = createdLedgers.length;
    let currentLedgerIndex = 0;

    for (const ledgerItem of createdLedgers) {
        const ledger = ledgerItem as any;
        const lId = ledger.id;
        const config = ledger.config;

        onProgress({ stage: `Populating ${config.name}...`, progress: 10 + (currentLedgerIndex / totalLedgers) * 80, totalStages: TOTAL_STAGES });

        // --- Create Accounts ---
        const accountMap = new Map<string, string>(); // Name -> ID or Currency? Just need check existence.
        const createdAccountNames: string[] = [];

        for (let i = 0; i < config.accounts.length; i++) {
            const accName = config.accounts[i];
            const accCurr = config.currencies[i];

            await dataProvider.ensurePayeeExists(accName, true, lId, {
                currency: accCurr,
                startingBalance: Math.floor(Math.random() * 5000) + 1000,
                type: accName.includes('Isa') ? 'Investment' : (accName.includes('Card') ? 'Credit Card' : (accName.includes('Savings') ? 'Savings' : 'Checking'))
            });
            accountMap.set(accName, accCurr);
            createdAccountNames.push(accName);
        }

        // --- Create Categories ---
        const categories = ['Groceries', 'Utilities', 'Rent', 'Entertainment', 'Transport', 'Healthcare', 'Shopping', 'Dining Out', 'Pets', 'Personal Care', 'Education', 'Home Services', 'Housing', 'Transfer', 'Health'];
        const categoryMap = new Map<string, string>(); // Name -> ID

        for (const cat of categories) {
            const id = await dataProvider.ensureCategoryExists(cat, lId);
            if (id) categoryMap.set(cat, id);

            // Ensure subs for specific categories used in demo
            if (cat === 'Dining Out') {
                await dataProvider.ensureSubCategoryExists('Coffee', id!, lId);
                await dataProvider.ensureSubCategoryExists('Restaurants', id!, lId);
                await dataProvider.ensureSubCategoryExists('Bars', id!, lId);
            }
            if (cat === 'Transport') {
                await dataProvider.ensureSubCategoryExists('Fuel', id!, lId);
                await dataProvider.ensureSubCategoryExists('Public Transport', id!, lId);
            }
            if (cat === 'Shopping') {
                await dataProvider.ensureSubCategoryExists('Electronics', id!, lId);
                await dataProvider.ensureSubCategoryExists('Clothing', id!, lId);
            }
            if (cat === 'Housing') {
                await dataProvider.ensureSubCategoryExists('Rent', id!, lId);
            }
            if (cat === 'Health') {
                await dataProvider.ensureSubCategoryExists('Insurance', id!, lId);
                await dataProvider.ensureSubCategoryExists('Gym', id!, lId);
            }
            if (cat === 'Utilities') {
                await dataProvider.ensureSubCategoryExists('Electricity', id!, lId);
            }
        }

        // --- Create Budgets ---
        // Filter budgets for categories that exist
        for (const budget of DEMO_BUDGETS) {
            const catId = categoryMap.get(budget.category);
            if (!catId) continue;

            // Just add budget, no ID constraint uniqueness check needed here for demo really as we wiped data
            await dataProvider.addBudget({
                user_id: lId,
                category_id: catId,
                category_name: budget.category,
                // sub_category_id: ... needs lookup but DataProvider usually handles name lookup? 
                // LocalDataProvider addBudget takes names but stores them. It doesn't strictly validate sub_category_id presence in this simple implementation? 
                // Let's rely on names which UI uses mostly. 
                // Actually `addBudget` in context or provider just stores what we give.
                target_amount: budget.amount,
                currency: config.currency, // Use ledger currency
                start_date: new Date().toISOString(),
                end_date: null,
                frequency: budget.frequency as any,
                sub_category_name: budget.sub
            });
        }

        // --- Create Scheduled Transactions ---
        // Use the ledger-specific scheduled transactions, or default to empty if none found
        const scheduledTransactions = config.scheduledTransactions || [];

        for (const sched of scheduledTransactions) {
            // Map Account Type to Real Account
            let accountName = createdAccountNames.find(n => {
                if (sched.accountType === 'Checking') return n.includes('Checking') || n.includes('Allowance') || n.includes('Foreign Checking');
                if (sched.accountType === 'Credit Card') return n.includes('Card');
                if (sched.accountType === 'Savings') return n.includes('Savings') || n.includes('Isa') || n.includes('Offshore Savings');
                return false;
            });

            if (!accountName) {
                // Fallback
                accountName = createdAccountNames[0];
            }

            // Map Vendor
            let vendorName = sched.vendor;
            if (sched.isTransfer) {
                // Determine target account
                const targetAcc = createdAccountNames.find(n => {
                    if (sched.vendor.includes('Savings')) return n.includes('Savings') || n.includes('Isa') || n.includes('Pocket');
                    if (sched.vendor.includes('Checking')) return n.includes('Checking');
                    if (sched.vendor.includes('Offshore')) return n.includes('Offshore');
                    return false;
                });
                if (targetAcc) vendorName = targetAcc;
                else vendorName = createdAccountNames[createdAccountNames.length - 1]; // Last one as fallback

                // If source == target, skip
                if (accountName === vendorName) continue;
            }

            const schedDate = new Date();
            schedDate.setDate(schedDate.getDate() + (sched.next_date_offset || 1));

            // Ensure vendor/payee exists if it's external
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
                currency: accountMap.get(accountName) || 'USD',
                date: schedDate.toISOString(),
                frequency: sched.frequency,
                remarks: sched.remarks,
            });

            // Note: For transfers, we probably should create the PAIR too? 
            // The Context `addScheduledTransaction` handles pairing. This `dataProvider.addScheduledTransaction` does NOT.
            // So we manually create pair for transfer.
            if (sched.isTransfer) {
                await dataProvider.ensureCategoryExists('Transfer', lId);
                // Create destination pair
                await dataProvider.addScheduledTransaction({
                    user_id: lId,
                    account: vendorName, // Swapped
                    vendor: accountName, // Swapped
                    category: 'Transfer',
                    sub_category: null,
                    amount: -sched.amount, // Negate
                    currency: accountMap.get(vendorName) || 'USD',
                    date: schedDate.toISOString(),
                    frequency: sched.frequency,
                    remarks: sched.remarks,
                    transfer_id: undefined // We can link them if we generated a UUID but checking Context flow it might settle later. 
                    // Let's just create unlinked or link them? 
                    // `dataProvider` doesn't enforce link UUID. 
                    // Better to link them if we can.
                });
            }
        }

        // --- Create Random Transactions ---
        const now = new Date();
        const numTransactions = 60; // 6 months of data roughly

        for (let i = 0; i < numTransactions; i++) {
            const daysAgo = Math.floor(Math.random() * 180);
            const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            const isExpense = Math.random() > 0.3;
            const amount = isExpense ? -Math.floor(Math.random() * 100) - 5 : Math.floor(Math.random() * 2000) + 500;
            const category = categories[Math.floor(Math.random() * categories.length)];
            const account = config.accounts[Math.floor(Math.random() * config.accounts.length)];
            const currency = accountMap.get(account) || config.currency;

            await dataProvider.addTransaction({
                user_id: lId,
                date: date.toISOString(),
                amount: amount,
                currency: currency,
                account: account,
                vendor: isExpense ? `Store ${Math.floor(Math.random() * 10)}` : 'Employer',
                category: category,
                remarks: 'Demo transaction'
            });
        }
        currentLedgerIndex++;
    }

    onProgress({ stage: 'Finalizing...', progress: 100, totalStages: TOTAL_STAGES });
    await new Promise(r => setTimeout(r, 800));
};
