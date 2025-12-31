import Papa from 'papaparse';
import { AccountUpsertType } from '@/types/database';

/**
 * Parses a CSV file containing account data and returns an array of AccountUpsertType objects.
 * Expected CSV headers (case-insensitive): Name, Currency, Starting Balance, Remarks
 */
export function parseAccountsCsv(file: File): Promise<AccountUpsertType[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s/g, '_'),
      complete: (results) => {
        const requiredHeaders = ['name', 'currency', 'starting_balance'];
        
        // Check if headers are present
        const missingHeaders = requiredHeaders.filter(h => !results.meta.fields?.includes(h));
        if (missingHeaders.length > 0) {
          return reject(new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}`));
        }

        const accounts: AccountUpsertType[] = results.data
          .map((row: any) => {
            const name = row.name?.trim();
            const currency = row.currency?.trim() || 'USD';
            const startingBalance = parseFloat(row.starting_balance);
            const remarks = row.remarks?.trim() || null;

            // Basic validation
            if (!name || isNaN(startingBalance)) {
              return null;
            }

            return {
              name,
              currency,
              starting_balance: startingBalance,
              remarks,
            } as AccountUpsertType;
          })
          .filter((account): account is AccountUpsertType => account !== null);

        resolve(accounts);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}