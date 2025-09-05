import { type ChartConfig } from "@/components/ui/chart";

export const incomeVsExpensesData = [
  { month: "Aug", income: 4000, expenses: 2500 },
  { month: "Sep", income: 4200, expenses: 2800 },
  { month: "Oct", income: 4100, expenses: 2900 },
  { month: "Nov", income: 4500, expenses: 3000 },
  { month: "Dec", income: 4800, expenses: 3200 },
  { month: "Jan", income: 5000, expenses: 3400 },
  { month: "Feb", income: 5200, expenses: 3500 },
  { month: "Mar", income: 5100, expenses: 3600 },
  { month: "Apr", income: 5300, expenses: 3700 },
];

export const spendingCategoriesData = [
  { name: "groceries", value: 45, fill: "var(--color-groceries)" },
  { name: "utilities", value: 20, fill: "var(--color-utilities)" },
  { name: "transport", value: 15, fill: "var(--color-transport)" },
  { name: "entertainment", value: 20, fill: "var(--color-entertainment)" },
];

export const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
  groceries: {
    label: "Groceries",
    color: "hsl(var(--chart-1))",
  },
  utilities: {
    label: "Utilities",
    color: "hsl(var(--chart-2))",
  },
  transport: {
    label: "Transport",
    color: "hsl(var(--chart-3))",
  },
  entertainment: {
    label: "Entertainment",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export type Transaction = {
  id: string;
  transferId?: string;
  date: string;
  account: string;
  currency: string;
  vendor: string;
  amount: number;
  remarks?: string;
  category: string;
  created_at: string; // Added for Supabase
};

export const categories = ["Groceries", "Utilities", "Transport", "Entertainment", "Salary", "Shopping", "Health", "Dining Out", "Transfer"];
export const accounts = ["Checking Account", "Savings Account", "Credit Card", "Investment Account", "Travel Fund", "Emergency Fund"];
export const vendors = Array.from({ length: 15 }, (_, i) => `Vendor ${i + 1}`);

// Removed transactionsData as it will now be fetched from Supabase