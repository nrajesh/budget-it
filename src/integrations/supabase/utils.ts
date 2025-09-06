import { supabase } from './client';
import { showError } from '@/utils/toast';

/**
 * Ensures a payee (vendor or account) exists in the 'vendors' table,
 * and if it's an account, ensures a corresponding entry in the 'accounts' table.
 * @param name The name of the payee.
 * @param isAccount True if the payee should be treated as an account, false for a regular vendor.
 * @param options Optional parameters for new account creation (currency, startingBalance, remarks).
 * @returns The ID of the existing or newly created vendor, or null if an error occurred.
 */
export async function ensurePayeeExists(
  name: string,
  isAccount: boolean,
  options?: { currency?: string; startingBalance?: number; remarks?: string }
): Promise<string | null> {
  if (!name) {
    console.warn("ensurePayeeExists called with empty name.");
    return null;
  }

  try {
    // 1. Check if a vendor with this name already exists
    let { data: existingVendor, error: vendorFetchError } = await supabase
      .from('vendors')
      .select('id, name, is_account, account_id')
      .eq('name', name)
      .single();

    if (vendorFetchError && vendorFetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw vendorFetchError;
    }

    if (existingVendor) {
      // Payee exists
      if (isAccount) {
        // It should be an account. Ensure it's correctly set up as one and has a currency.
        let accountId = existingVendor.account_id;
        let accountCurrency: string | null = null;

        if (accountId) {
          // Fetch existing account details to check currency
          const { data: existingAccountData, error: fetchAccountError } = await supabase
            .from('accounts')
            .select('currency')
            .eq('id', accountId)
            .single();

          if (fetchAccountError && fetchAccountError.code !== 'PGRST116') {
            throw fetchAccountError;
          }
          accountCurrency = existingAccountData?.currency || null;
        }

        // If account_id is missing or currency is null, create/update account entry
        if (!accountId || !accountCurrency) {
          const { data: upsertedAccount, error: upsertAccountError } = await supabase
            .from('accounts')
            .upsert({
              id: accountId || undefined, // Use existing ID if present, otherwise let Supabase generate
              currency: options?.currency || accountCurrency || 'USD', // Prioritize options, then existing, then default
              starting_balance: options?.startingBalance || 0,
              remarks: options?.remarks || `Auto-created/updated account for vendor: ${name}`,
            }, { onConflict: 'id' }) // Upsert by ID
            .select('id, currency')
            .single();

          if (upsertAccountError) throw upsertAccountError;
          accountId = upsertedAccount.id;
          accountCurrency = upsertedAccount.currency;
        }

        // Ensure vendor is marked as account and linked
        if (!existingVendor.is_account || existingVendor.account_id !== accountId) {
          const { error: updateVendorError } = await supabase
            .from('vendors')
            .update({ is_account: true, account_id: accountId })
            .eq('id', existingVendor.id);
          if (updateVendorError) throw updateVendorError;
        }
      } else {
        // It should be a regular vendor. Ensure it's not marked as an account.
        // If an existing vendor is an account, but we're trying to treat it as a regular vendor,
        // we'll prioritize its existing 'is_account' status to avoid unintended data changes.
        if (existingVendor.is_account) {
          console.warn(`Attempted to treat existing account "${name}" as a regular vendor. Keeping it as an account.`);
        }
      }
      return existingVendor.id;
    } else {
      // Vendor does not exist, create it
      if (isAccount) {
        // Create both an account and a linked vendor
        const { data: newAccount, error: newAccountError } = await supabase
          .from('accounts')
          .insert({
            currency: options?.currency || 'USD',
            starting_balance: options?.startingBalance || 0,
            remarks: options?.remarks || `Auto-created account for vendor: ${name}`,
          })
          .select('id')
          .single();
        if (newAccountError) throw newAccountError;

        const { data: newVendor, error: newVendorError } = await supabase
          .from('vendors')
          .insert({ name, is_account: true, account_id: newAccount.id })
          .select('id')
          .single();
        if (newVendorError) throw newVendorError;
        return newVendor.id;
      } else {
        // Create a regular vendor
        const { data: newVendor, error: newVendorError } = await supabase
          .from('vendors')
          .insert({ name, is_account: false, account_id: null })
          .select('id')
          .single();
        if (newVendorError) throw newVendorError;
        return newVendor.id;
      }
    }
  } catch (error: any) {
    console.error(`Error in ensurePayeeExists for "${name}":`, error.message);
    showError(`Error ensuring payee "${name}" exists: ${error.message}`);
    return null;
  }
}

/**
 * Checks if a payee with the given name is currently marked as an account in the database.
 * @param name The name of the payee to check.
 * @returns True if the payee is an account, false otherwise or if an error occurs.
 */
export async function checkIfPayeeIsAccount(name: string): Promise<boolean> {
  if (!name) return false;
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('is_account')
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw error;
    }
    return data?.is_account || false;
  } catch (error: any) {
    console.error(`Error checking if payee "${name}" is an account: ${error.message}`);
    return false;
  }
}

/**
 * Fetches the currency of a given account.
 * @param accountName The name of the account.
 * @returns The currency code (e.g., 'USD', 'EUR') or null if not found/error.
 */
export async function getAccountCurrency(accountName: string): Promise<string | null> {
  if (!accountName) return null;
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('accounts(currency)')
      .eq('name', accountName)
      .eq('is_account', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    // The 'accounts' relationship returns an array, even if single() is used on the parent.
    // We expect only one account for a given vendor name marked as an account.
    return data?.accounts?.[0]?.currency || null;
  } catch (error: any) {
    console.error(`Error fetching currency for account "${accountName}": ${error.message}`);
    return null;
  }
}

/**
 * Fetches details for a given account.
 * @param accountName The name of the account.
 * @returns An object containing currency, starting_balance, and remarks, or null if not found/error.
 */
export async function getAccountDetails(accountName: string): Promise<{ currency: string; starting_balance: number; remarks: string } | null> {
  if (!accountName) return null;
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('accounts(currency, starting_balance, remarks)')
      .eq('name', accountName)
      .eq('is_account', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    // The 'accounts' relationship returns an array, even if single() is used on the parent.
    // We expect only one account for a given vendor name marked as an account.
    return data?.accounts?.[0] || null;
  } catch (error: any) {
    console.error(`Error fetching details for account "${accountName}": ${error.message}`);
    return null;
  }
}