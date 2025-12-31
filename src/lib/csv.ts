import Papa from 'papaparse';
import { AccountUpsertType } from '@/types/database';

export interface AccountImportRow {
  Name: string;
  Currency: string;
  'Starting Balance': string; // Read as string from CSV
  Remarks: string;
}

export const parseAccountsCsv = (file: File): Promise<AccountUpsertType[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const parsedData: AccountUpsertType[] = [];
        
        if (results.errors.length > 0) {
            console.error("CSV Parsing Errors:", results.errors);
            reject(new Error("Failed to parse CSV file. Check console for details."));
            return;
        }

        (results.data as AccountImportRow[]).forEach((row, index) => {
          // Basic validation and transformation
          const name = row.Name?.trim();
          const currency = row.Currency?.trim() || 'USD';
          const startingBalanceStr = row['Starting Balance']?.replace(/[^0-9.-]/g, '');
          const starting_balance = parseFloat(startingBalanceStr || '0');
          const remarks = row.Remarks?.trim() || null;

          if (name) {
            parsedData.push({
              name,
              currency,
              starting_balance: isNaN(starting_balance) ? 0 : starting_balance,
              remarks,
            });
          } else {
            console.warn(`Skipping row ${index + 1}: Name is missing.`);
          }
        });
        resolve(parsedData);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};