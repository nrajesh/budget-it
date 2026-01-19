export interface ProgressCallback {
    (progress: { stage: string; progress: number; totalStages: number }): void;
}

const ACCOUNTS: { name: string; type: any; currency: string; creditLimit?: number }[] = [
    { name: 'Checking Account', type: 'Checking', currency: 'USD' },
    { name: 'Savings Vault', type: 'Savings', currency: 'USD' },
    { name: 'London Stash', type: 'Savings', currency: 'GBP' },
    { name: 'Euro Travel', type: 'Checking', currency: 'EUR' },
    { name: 'Credit Card', type: 'Credit Card', currency: 'USD', creditLimit: 2000 },
];

const CATEGORIES_WITH_SUBS = [
    { name: 'Groceries', subs: ['Supermarket', 'Butcher', 'Bakery', 'Convenience Store'] },
    { name: 'Utilities', subs: ['Electricity', 'Water', 'Internet', 'Phone'] },
    { name: 'Transport', subs: ['Fuel', 'Public Transport', 'Taxi/Uber', 'Car Maintenance'] },
    { name: 'Entertainment', subs: ['Movies', 'Streaming', 'Games', 'Concerts', 'Events'] },
    { name: 'Shopping', subs: ['Clothing', 'Electronics', 'Home', 'Gifts', 'Hobbies'] },
    { name: 'Health', subs: ['Doctor', 'Pharmacy', 'Gym', 'Insurance', 'Dental'] },
    { name: 'Dining Out', subs: ['Restaurants', 'Coffee', 'Fast Food', 'Bars'] },
    { name: 'Income', subs: ['Salary', 'Freelance', 'Dividends', 'Refunds'] },
    { name: 'Transfer', subs: [] },
    { name: 'Education', subs: ['Courses', 'Books', 'Tuition'] },
    { name: 'Personal Care', subs: ['Hair', 'Spa', 'Cosmetics'] },
    { name: 'Pets', subs: ['Food', 'Vet', 'Toys'] },
    { name: 'Home Services', subs: ['Cleaning', 'Repairs', 'Gardening'] },
    { name: 'Travel', subs: ['Flights', 'Hotels', 'Car Rental', 'Activities'] },
    { name: 'Subscriptions', subs: ['Software', 'News', 'Music', 'Video'] },
    { name: 'Kids', subs: ['Activities', 'School', 'Clothing', 'Toys'] },
    { name: 'Charity', subs: ['Donations'] },
    { name: 'Automotive', subs: ['Insurance', 'Repairs', 'Parking'] }
];

const VENDORS = [
    { name: 'Whole Foods Market', category: 'Groceries', sub: 'Supermarket' },
    { name: 'Trader Joe\'s', category: 'Groceries', sub: 'Supermarket' },
    { name: 'Local Butcher', category: 'Groceries', sub: 'Butcher' },
    { name: 'Corner Store', category: 'Groceries', sub: 'Convenience Store' },
    { name: 'Shell', category: 'Transport', sub: 'Fuel' },
    { name: 'Uber', category: 'Transport', sub: 'Taxi/Uber' },
    { name: 'MTA', category: 'Transport', sub: 'Public Transport' },
    { name: 'Netflix', category: 'Entertainment', sub: 'Streaming' },
    { name: 'Spotify', category: 'Entertainment', sub: 'Streaming' },
    { name: 'AMC Theaters', category: 'Entertainment', sub: 'Movies' },
    { name: 'Ticketmaster', category: 'Entertainment', sub: 'Concerts' },
    { name: 'Electric Company', category: 'Utilities', sub: 'Electricity' },
    { name: 'AT&T', category: 'Utilities', sub: 'Internet' },
    { name: 'Verizon', category: 'Utilities', sub: 'Phone' },
    { name: 'Amazon', category: 'Shopping', sub: 'Home' },
    { name: 'Target', category: 'Shopping', sub: 'Clothing' },
    { name: 'Best Buy', category: 'Shopping', sub: 'Electronics' },
    { name: 'Steam', category: 'Entertainment', sub: 'Games' },
    { name: 'CVS Pharmacy', category: 'Health', sub: 'Pharmacy' },
    { name: 'Planet Fitness', category: 'Health', sub: 'Gym' },
    { name: 'Dr. Smith', category: 'Health', sub: 'Doctor' },
    { name: 'Smile Dental', category: 'Health', sub: 'Dental' },
    { name: 'Pizza Hut', category: 'Dining Out', sub: 'Fast Food' },
    { name: 'Starbucks', category: 'Dining Out', sub: 'Coffee' },
    { name: 'Local Pub', category: 'Dining Out', sub: 'Bars' },
    { name: 'Sushi Palace', category: 'Dining Out', sub: 'Restaurants' },
    { name: 'Tech Corp', category: 'Income', sub: 'Salary' },
    { name: 'SNCF', category: 'Transport', sub: 'Public Transport' }, // EUR Vendor
    { name: 'Pret A Manger', category: 'Dining Out', sub: 'Coffee' }, // GBP Vendor
    { name: 'Udemy', category: 'Education', sub: 'Courses' },
    { name: 'Barnes & Noble', category: 'Education', sub: 'Books' },
    { name: 'Sephora', category: 'Personal Care', sub: 'Cosmetics' },
    { name: 'Supercuts', category: 'Personal Care', sub: 'Hair' },
    { name: 'PetSmart', category: 'Pets', sub: 'Food' },
    { name: 'Vet Clinic', category: 'Pets', sub: 'Vet' },
    { name: 'Local Plumber', category: 'Home Services', sub: 'Repairs' },
    { name: 'University', category: 'Education', sub: 'Tuition' },
    { name: 'Chewy', category: 'Pets', sub: 'Toys' },
    { name: 'Apple', category: 'Shopping', sub: 'Electronics' },
    { name: 'Delta Airlines', category: 'Travel', sub: 'Flights' },
    { name: 'Airbnb', category: 'Travel', sub: 'Hotels' },
    { name: 'Hertz', category: 'Travel', sub: 'Car Rental' },
    { name: 'Adobe', category: 'Subscriptions', sub: 'Software' },
    { name: 'NY Times', category: 'Subscriptions', sub: 'News' },
    { name: 'Kumon', category: 'Kids', sub: 'School' },
    { name: 'Gap Kids', category: 'Kids', sub: 'Clothing' },
    { name: 'Red Cross', category: 'Charity', sub: 'Donations' },
    { name: 'Geico', category: 'Automotive', sub: 'Insurance' },
    { name: 'City Parking', category: 'Automotive', sub: 'Parking' }
];

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

const DEMO_SCHEDULED = [
    {
        account: 'Checking Account',
        vendor: 'Landlord',
        category: 'Housing',
        amount: -1200,
        frequency: 'Monthly',
        remarks: 'Rent Payment'
    },
    {
        account: 'Credit Card',
        vendor: 'Netflix',
        category: 'Entertainment',
        sub_category: 'Streaming',
        amount: -15.99,
        frequency: 'Monthly',
        remarks: 'Netflix Subscription'
    },
    {
        account: 'Checking Account',
        vendor: 'Savings Vault',
        category: 'Transfer',
        amount: -500,
        frequency: 'Monthly',
        remarks: 'Monthly Savings Transfer',
        isTransfer: true
    },
    {
        account: 'Checking Account',
        vendor: 'IRS',
        category: 'Health',
        sub_category: 'Insurance',
        amount: -15000,
        frequency: 'Yearly',
        remarks: 'Tax Payment',
        next_date_offset: 2
    },
    {
        account: 'Checking Account',
        vendor: 'Spotify',
        category: 'Entertainment',
        sub_category: 'Streaming',
        amount: -9.99,
        frequency: 'Monthly',
        remarks: 'Spotify Subscription'
    },
    {
        account: 'Credit Card',
        vendor: 'Gym',
        category: 'Health',
        sub_category: 'Gym',
        amount: -29.99,
        frequency: 'Monthly',
        remarks: 'Gym Membership'
    },
    {
        account: 'Checking Account',
        vendor: 'Electric Company',
        category: 'Utilities',
        sub_category: 'Electricity',
        amount: -150,
        frequency: 'Monthly',
        remarks: 'Electricity Bill'
    },
    {
        account: 'Checking Account',
        vendor: 'PetSmart',
        category: 'Pets',
        sub_category: 'Food',
        amount: -80,
        frequency: 'Monthly',
        remarks: 'Pet Food'
    }
];

export const generateDemoData = async (
    dataProvider: any,
    onProgress: ProgressCallback
) => {
    const TOTAL_STAGES = 100;
    const userId = 'local-user';

    // Stage 1: Clear existing data
    onProgress({ stage: 'Clearing existing data...', progress: 10, totalStages: TOTAL_STAGES });
    await dataProvider.clearAllData();

    // Stage 2: Create Categories & Sub-categories
    onProgress({ stage: 'Creating categories...', progress: 30, totalStages: TOTAL_STAGES });

    const categoryMap: Record<string, string> = {};
    const subCategoryMap: Record<string, Record<string, string>> = {};

    for (const cat of CATEGORIES_WITH_SUBS) {
        const catId = await dataProvider.ensureCategoryExists(cat.name, userId);
        if (catId) {
            categoryMap[cat.name] = catId;
            subCategoryMap[cat.name] = {};

            if (cat.subs.length > 0) {
                for (const sub of cat.subs) {
                    const subId = await dataProvider.ensureSubCategoryExists(sub, catId, userId);
                    if (subId) {
                        subCategoryMap[cat.name][sub] = subId;
                    }
                }
            }
        }
    }

    // Ensure Housing category exists for Rent if not present
    const housingId = await dataProvider.ensureCategoryExists('Housing', userId);
    if (housingId) {
        categoryMap['Housing'] = housingId;
        const rentId = await dataProvider.ensureSubCategoryExists('Rent', housingId, userId);
        if (rentId) {
            if (!subCategoryMap['Housing']) subCategoryMap['Housing'] = {};
            subCategoryMap['Housing']['Rent'] = rentId;
        }
    }

    await new Promise(r => setTimeout(r, 500));

    // Stage 3: Create Accounts & Vendors
    onProgress({ stage: 'Setting up accounts...', progress: 50, totalStages: TOTAL_STAGES });

    // Create Accounts
    for (const acc of ACCOUNTS) {
        await dataProvider.ensurePayeeExists(acc.name, true, {
            currency: acc.currency,
            startingBalance: Math.floor(Math.random() * 5000) + 1000,
            remarks: 'Demo Account',
            type: acc.type,
            creditLimit: acc.creditLimit
        });
    }

    // Create Vendors
    for (const v of VENDORS) {
        if (v.category === 'Income') continue;
        await dataProvider.ensurePayeeExists(v.name, false, {
            remarks: 'Demo Vendor'
        });
    }

    // Initialize Payee for Landlord to ensure it exists for scheduled transaction
    await dataProvider.ensurePayeeExists('Landlord', false, { remarks: 'Property Manager' });

    // Ensure 'Emergency Services' vendor for alerts
    await dataProvider.ensurePayeeExists('Emergency Services', false, { remarks: 'One-time large expense' });

    // Stage 4: Create Budgets
    onProgress({ stage: 'Setting up budgets...', progress: 60, totalStages: TOTAL_STAGES });

    const addedBudgets = new Set<string>();

    for (const budget of DEMO_BUDGETS) {
        const catId = categoryMap[budget.category];
        if (!catId) continue;

        let subId = null;
        if (budget.sub) {
            subId = subCategoryMap[budget.category]?.[budget.sub] || null;
        }

        // Deduplicate
        const uniqueKey = `${catId}-${subId || 'null'}`;
        if (addedBudgets.has(uniqueKey)) {
            console.warn(`Skipping duplicate budget for ${budget.category} - ${budget.sub || 'All'}`);
            continue;
        }
        addedBudgets.add(uniqueKey);

        await dataProvider.addBudget({
            user_id: userId,
            category_id: catId,
            category_name: budget.category,
            sub_category_id: subId,
            sub_category_name: budget.sub || null,
            target_amount: budget.amount,
            currency: 'USD',
            start_date: new Date().toISOString(),
            end_date: null,
            frequency: budget.frequency,
        });
    }

    // Stage 5: Create Scheduled Transactions
    onProgress({ stage: 'Scheduling transactions...', progress: 65, totalStages: TOTAL_STAGES });

    for (const sched of DEMO_SCHEDULED) {
        const schedDate = new Date();
        schedDate.setDate(schedDate.getDate() + (sched.next_date_offset || 1));

        await dataProvider.addScheduledTransaction({
            user_id: userId,
            account: sched.account,
            vendor: sched.vendor,
            category: sched.category,
            sub_category: sched.sub_category || null,
            amount: sched.amount,
            currency: 'USD',
            date: schedDate.toISOString(),
            frequency: sched.frequency,
            remarks: sched.remarks,
        });
    }

    // Stage 4: Generate Transactions
    onProgress({ stage: 'Generating transactions...', progress: 70, totalStages: TOTAL_STAGES });

    const transactions = [];
    // Generate ~600 random transactions + regular monthly items
    // First, generate regular monthly items for "Salary" and "Rent" to ensure stable income/expense
    const MONTHS_TO_GENERATE = 24; // 2 Years
    const today = new Date();

    // Regular Income (Salary)
    // Helper to generate N monthly occurrences starting from the latest valid date
    const generateMonthlySequence = (
        dayOfMonth: number,
        count: number,
        generator: (date: string) => void
    ) => {
        let latestDate = new Date(today);
        latestDate.setDate(dayOfMonth);
        // If the date for this month is in the future, start from last month
        if (latestDate > today) {
            latestDate.setMonth(latestDate.getMonth() - 1);
        }

        for (let i = 0; i < count; i++) {
            const d = new Date(latestDate);
            d.setMonth(latestDate.getMonth() - i);
            generator(d.toISOString());
        }
    };

    // 1. Salary (25th)
    generateMonthlySequence(25, MONTHS_TO_GENERATE, (dateIso) => {
        transactions.push({
            date: dateIso,
            amount: 5000 + Math.random() * 200,
            vendor: 'Tech Corp',
            category: 'Income',
            sub_category: 'Salary',
            account: 'Checking Account',
            remarks: 'Monthly Salary',
            currency: 'USD',
            user_id: userId,
        });
    });

    // 2. Rent (1st)
    generateMonthlySequence(1, MONTHS_TO_GENERATE, (dateIso) => {
        transactions.push({
            date: dateIso,
            amount: -1200,
            vendor: 'Landlord',
            category: 'Housing',
            sub_category: 'Rent',
            account: 'Checking Account',
            remarks: 'Monthly Rent',
            currency: 'USD',
            user_id: userId,
        });
    });

    // 3. Credit Card Payment (15th)
    generateMonthlySequence(15, MONTHS_TO_GENERATE, (dateIso) => {
        const amount = 1500 + Math.random() * 500;
        // Out from Checking
        transactions.push({
            date: dateIso,
            amount: -amount,
            vendor: 'Credit Card',
            category: 'Transfer',
            sub_category: null,
            account: 'Checking Account',
            remarks: 'Credit Card Bill Payment',
            currency: 'USD',
            user_id: userId,
        });
        // In to CC
        transactions.push({
            date: dateIso,
            amount: amount,
            vendor: 'Checking Account',
            category: 'Transfer',
            sub_category: null,
            account: 'Credit Card',
            remarks: 'Payment Received',
            currency: 'USD',
            user_id: userId,
        });
    });

    // 4. GBP Transfer (20th)
    generateMonthlySequence(20, MONTHS_TO_GENERATE, (dateIso) => {
        // Out
        transactions.push({
            date: dateIso,
            amount: -200,
            vendor: 'London Stash',
            category: 'Transfer',
            sub_category: null,
            account: 'Checking Account',
            remarks: 'Transfer to GBP Savings',
            currency: 'USD',
            user_id: userId,
        });
        // In
        transactions.push({
            date: dateIso,
            amount: 150,
            vendor: 'Checking Account',
            category: 'Transfer',
            sub_category: null,
            account: 'London Stash',
            remarks: 'Received from Checking',
            currency: 'GBP',
            user_id: userId,
        });
    });

    // 5. Weekly Savings Transfer (Every Friday logic approximation - just 4 times a month)
    generateMonthlySequence(5, MONTHS_TO_GENERATE * 4, (dateIso) => {
        transactions.push({
            date: dateIso,
            amount: -50,
            vendor: 'Savings Vault',
            category: 'Transfer',
            sub_category: null,
            account: 'Checking Account',
            remarks: 'Weekly Savings',
            currency: 'USD',
            user_id: userId,
        });
        transactions.push({
            date: dateIso,
            amount: 50,
            vendor: 'Checking Account',
            category: 'Transfer',
            sub_category: null,
            account: 'Savings Vault',
            remarks: 'Weekly Savings Deposit',
            currency: 'USD',
            user_id: userId,
        });
    });


    // Generate ~1200 random transactions to fill the gaps, with density in recent months
    for (let i = 0; i < 1200; i++) {
        const randomVendor = VENDORS[Math.floor(Math.random() * VENDORS.length)];
        // Skip Income or Transfer vendors for random noise, focus on spending
        if (randomVendor.category === 'Income' || randomVendor.category === 'Transfer') continue;

        // Weighted Date Generation:
        // 50% chance for last 30 days (Current Month Density)
        // 30% chance for last 30-90 days
        // 20% chance for 3-24 months ago
        const rand = Math.random();
        let daysAgo = 0;

        if (rand < 0.5) {
            // Recent: 0-30 days
            daysAgo = Math.floor(Math.random() * 30);
        } else if (rand < 0.8) {
            // Mid-term: 30-90 days
            daysAgo = 30 + Math.floor(Math.random() * 60);
        } else {
            // Long-term: 90-730 days
            daysAgo = 90 + Math.floor(Math.random() * 640);
        }

        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);

        // Amount Variety logic
        let baseAmount = 10;
        if (['Groceries'].includes(randomVendor.category)) baseAmount = 50 + Math.random() * 100;
        if (['Dining Out'].includes(randomVendor.category)) baseAmount = 15 + Math.random() * 60; // Coffee vs Dinner
        if (['Transport'].includes(randomVendor.category)) baseAmount = 20 + Math.random() * 40;
        if (['Travel'].includes(randomVendor.category)) baseAmount = 200 + Math.random() * 800;
        if (['Shopping'].includes(randomVendor.category)) baseAmount = 30 + Math.random() * 200;
        if (['Utilities'].includes(randomVendor.category)) baseAmount = 80 + Math.random() * 120;

        // Add some noise
        const amount = -(baseAmount + (Math.random() * 20 - 10));

        // Pick random account, prioritize Credit Card for liabilities
        let accountName = Math.random() > 0.4 ? 'Credit Card' : 'Checking Account';
        let currency = 'USD';

        // Add some EUR transactions
        if (Math.random() > 0.92) {
            accountName = 'Euro Travel';
            currency = 'EUR';
        }

        transactions.push({
            date: date.toISOString(),
            amount: Number(amount.toFixed(2)),
            vendor: randomVendor.name,
            category: randomVendor.category,
            sub_category: randomVendor.sub,
            account: accountName,
            remarks: `Demo Transaction`,
            currency: currency,
            user_id: userId,
        });
    }

    // --- ALERT SCENARIOS ---

    // 1. Negative Balance Alert
    // Add a large one-time expense to 'Checking Account' about 45 days ago
    const largeExpenseDate = new Date(today);
    largeExpenseDate.setDate(largeExpenseDate.getDate() - 45);
    transactions.push({
        date: largeExpenseDate.toISOString(),
        amount: -8000, // Large amount to dip into negative (assuming balance < 8000)
        vendor: 'Emergency Services',
        category: 'Health',
        sub_category: 'Doctor',
        account: 'Checking Account',
        remarks: 'Emergency Medical Bill (Simulated Negative Balance)',
        currency: 'USD',
        user_id: userId,
    });

    // 2. Budget Breach Alert (Shopping)
    // Create excessive shopping transactions for the last 3 months
    for (let m = 0; m < 3; m++) {
        const breachDate = new Date(today);
        breachDate.setMonth(today.getMonth() - m);
        breachDate.setDate(10); // 10th of each month

        transactions.push({
            date: breachDate.toISOString(),
            amount: -300, // Significantly over $150 budget
            vendor: 'Amazon',
            category: 'Shopping',
            sub_category: 'Home',
            account: 'Credit Card',
            remarks: 'Impulse Buying Spree (Simulated Budget Breach)',
            currency: 'USD',
            user_id: userId,
        });
    }

    // Batch add transactions
    for (const t of transactions) {
        await dataProvider.addTransaction(t);
    }

    onProgress({ stage: 'Finalizing...', progress: 100, totalStages: TOTAL_STAGES });
    await new Promise(r => setTimeout(r, 800));
};
