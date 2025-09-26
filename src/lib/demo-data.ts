import { Transaction } from '@/data/finance-data';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const getRandomAmount = (min: number, max: number): number => parseFloat((Math.random() * (max - min) + min).toFixed(2));

export const generateRandomTransactions = (
  count: number,
  accounts: string[],
  vendors: string[],
  categories: string[],
  currencies: string[],
  userId: string
): Omit<Transaction, 'id' | 'created_at'>[] => {
  const transactions: Omit<Transaction, 'id' | 'created_at'>[] = [];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();

  for (let i = 0; i < count; i++) {
    const category = getRandomElement(categories);
    const isExpense = Math.random() > 0.3; // 70% chance of being an expense
    const amount = isExpense ? -getRandomAmount(5, 200) : getRandomAmount(50, 1000);

    transactions.push({
      date: getRandomDate(startDate, endDate).toISOString(),
      account: getRandomElement(accounts),
      vendor: getRandomElement(vendors),
      category,
      amount,
      currency: getRandomElement(currencies),
      remarks: `Random transaction ${i + 1}`,
      user_id: userId,
      is_scheduled_origin: false,
    });
  }

  return transactions;
};