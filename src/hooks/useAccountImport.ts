import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { AccountUpsertType } from '@/lib/types';
import { toast } from 'sonner';

// Define expected CSV headers
const REQUIRED_HEADERS = ['name', 'currency', 'starting_balance', 'remarks'];

export const useAccountImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importAccounts = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    if (file.type !== 'text/csv') {
      setError('Invalid file type. Please upload a CSV file.');
      setIsLoading(false);
      return;
    }

    const parsePromise = new Promise<AccountUpsertType[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error('Parsing errors:', results.errors);
            reject(new Error('CSV parsing failed. Check console for details.'));
            return;
          }

          const headers = Object.keys(results.data[0] || {});
          const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}`));
            return;
          }

          const accounts: AccountUpsertType[] = results.data
            .map((row: any, index) => {
              // Basic validation and type conversion
              const name = String(row.name || '').trim();
              const currency = String(row.currency || 'USD').toUpperCase().trim();
              const starting_balance = Number(row.starting_balance);
              const remarks = row.remarks ? String(row.remarks).trim() : null;

              if (!name) {
                console.warn(`Skipping row ${index + 1}: Name is required.`);
                return null;
              }
              if (isNaN(starting_balance)) {
                console.warn(`Skipping row ${index + 1}: Starting balance must be a number.`);
                return null;
              }

              return {
                name,
                currency,
                starting_balance,
                remarks,
              } as AccountUpsertType;
            })
            .filter((account): account is AccountUpsertType => account !== null);

          if (accounts.length === 0) {
            reject(new Error('No valid account data found in the CSV file.'));
            return;
          }

          resolve(accounts);
        },
        error: (error) => {
          reject(error);
        }
      });
    });

    try {
      const accountsToUpsert = await parsePromise;
      
      const { error: rpcError } = await supabase.rpc('batch_upsert_accounts', {
        p_accounts: accountsToUpsert,
      });

      if (rpcError) {
        console.error('Supabase RPC Error:', rpcError);
        setError(`Failed to save accounts: ${rpcError.message}`);
        toast.error('Failed to import accounts.');
      } else {
        toast.success(`Successfully imported ${accountsToUpsert.length} accounts.`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred during import.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { importAccounts, isLoading, error };
};