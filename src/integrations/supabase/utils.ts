import { supabase } from './client';
import { showError } from '@/utils/toast';

/**
 * Ensures a payee (vendor or account) exists in the 'vendors' table,
 * and if it's an account, ensures a corresponding entry in the 'accounts' table.
 * @param name The name of the payee.
 * @param isAccount True if the payee should be treated as an account, false for a regular vendor.
 * @returns The ID of the existing or newly created vendor, or null if an error occurred.
 */
export async function ensurePayeeExists(name: string, isAccount: boolean): Promise<string | null> {
  if (!name) {
    console.warn("ensurePayeeExists called with empty name.");
    return null;
  }

  try {
    console.log(`[ensurePayeeExists] Checking for payee: "${name}" (requested as account: ${isAccount})`);
    // 1. Check if a vendor with this name already exists
    let { data: existingVendor, error: vendorFetchError } = await supabase
      .from('vendors')
      .select('id, name, is_account, account_id')
      .eq('name', name)
      .single();

    if (vendorFetchError && vendorFetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error(`[ensurePayeeExists] Error fetching vendor "${name}":`, vendorFetchError.message);
      throw vendorFetchError;
    }

    if (existingVendor) {
      console.log(`[ensurePayeeExists] Found existing payee: "${existingVendor.name}" (ID: ${existingVendor.id}, is_account: ${existingVendor.is_account})`);
      // Payee exists, check if its type matches the requested type
      if (isAccount && (!existingVendor.is_account || !existingVendor.account_id)) {
        // Existing vendor should be an account but isn't fully set up as one.
        // Ensure an entry in 'accounts' table exists and link it.
        console.log(`[ensurePayeeExists]  Updating existing vendor "${name}" to be an account.`);
        let accountId = existingVendor.account_id;
        if (!accountId) {
          const { data: newAccount, error: newAccountError } = await supabase
            .from('accounts')
            .insert({
              currency: 'USD', // Default currency for auto-created accounts
              starting_balance: 0,
              remarks: `Auto-created account for vendor: ${name}`,
            })
            .select('id')
            .single();
          if (newAccountError) throw newAccountError;
          accountId = newAccount.id;
          console.log(`[ensurePayeeExists]  Created new account entry for "${name}" with ID: ${accountId}`);
        }
        const { error: updateVendorError } = await supabase
          .from('vendors')
          .update({ is_account: true, account_id: accountId })
          .eq('id', existingVendor.id);
        if (updateVendorError) throw updateVendorError;
        console.log(`[ensurePayeeExists]  Updated vendor "${name}" to link to account ID: ${accountId}`);
        return existingVendor.id;
      } else if (!isAccount && existingVendor.is_account) {
        // Existing vendor is an account, but we're trying to treat it as a regular vendor.
        // This is a potential conflict. We'll respect the existing 'is_account' status.
        console.warn(`[ensurePayeeExists] Attempted to create regular vendor "${name}" but it already exists as an account. Using existing record as account.`);
        return existingVendor.id; // Return existing ID, but it's an account
      }
      // If existingVendor is already correctly configured (e.g., already an account and isAccount is true,
      // or already a regular vendor and isAccount is false), just return its ID.
      return existingVendor.id;
    } else {
      // Vendor does not exist, create it
      console.log(`[ensurePayeeExists] Creating new payee: "${name}" (is_account: ${isAccount})`);
      if (isAccount) {
        // Create both an account and a linked vendor
        const { data: newAccount, error: newAccountError } = await supabase
          .from('accounts')
          .insert({
            currency: 'USD',
            starting_balance: 0,
            remarks: `Auto-created account for vendor: ${name}`,
          })
          .select('id')
          .single();
        if (newAccountError) throw newAccountError;
        console.log(`[ensurePayeeExists]  Created new account entry for "${name}" with ID: ${newAccount.id}`);

        const { data: newVendor, error: newVendorError } = await supabase
          .from('vendors')
          .insert({ name, is_account: true, account_id: newAccount.id })
          .select('id')
          .single();
        if (newVendorError) throw newVendorError;
        console.log(`[ensurePayeeExists]  Created new vendor entry for "${name}" with ID: ${newVendor.id}, linked to account ID: ${newAccount.id}`);
        return newVendor.id;
      } else {
        // Create a regular vendor
        const { data: newVendor, error: newVendorError } = await supabase
          .from('vendors')
          .insert({ name, is_account: false, account_id: null })
          .select('id')
          .single();
        if (newVendorError) throw newVendorError;
        console.log(`[ensurePayeeExists]  Created new regular vendor entry for "${name}" with ID: ${newVendor.id}`);
        return newVendor.id;
      }
    }
  } catch (error: any) {
    console.error(`[ensurePayeeExists] Error in ensurePayeeExists for "${name}":`, error.message);
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