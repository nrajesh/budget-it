import { LocalDataProvider } from '../src/providers/LocalDataProvider';


async function testVendorPersistence() {
    const provider = new LocalDataProvider();
    const testVendorName = `TestVendor_${Date.now()}`;

    console.log(`Adding transaction with new vendor: ${testVendorName}`);

    try {
        const txn = await provider.addTransaction({
            date: new Date().toISOString(),
            amount: -100,
            currency: 'USD',
            account: 'Test Account',
            vendor: testVendorName,
            category: 'Food',
            user_id: 'local-user'
        });

        console.log('Transaction added:', txn.id);

        const allVendors = await provider.getAllVendors('local-user');
        const foundVendor = allVendors.find(v => v.name === testVendorName);

        if (foundVendor) {
            console.log('Vendor found:', foundVendor);
            if (foundVendor.is_account) {
                console.error('FAIL: Vendor was created as an Account!');
            } else {
                console.log('SUCCESS: Vendor created correctly as non-account Payee.');
            }
        } else {
            console.error('FAIL: Vendor NOT found in getAllVendors()');
        }

        // Cleanup
        if (foundVendor) {
            await provider.deletePayee(foundVendor.id);
            console.log('Cleaned up test vendor.');
        }
        await provider.deleteTransaction(txn.id);

    } catch (err) {
        console.error('Error during test:', err);
    }
}

testVendorPersistence();
