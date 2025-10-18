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
  transfer_id?: string;
  date: string;
  account: string;
  currency: string;
  vendor: string;
  amount: number;
  remarks?: string;
  category: string;
  created_at: string;
  user_id: string; // Added user_id here
  is_scheduled_origin?: boolean; // Added optional property to reflect DB column
  recurrence_id?: string | null; // Added recurrence fields
  recurrence_frequency?: string | null;
  recurrence_end_date?: string | null; // Added recurrence_end_date
};

export type Category = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  totalTransactions?: number;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  currency: string;
  target_amount: number;
  start_date: string;
  frequency: string;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
};

// Base categories for seeding and initial demo data generation.
// The actual list in the app will be fetched from the database.
export const baseCategories = ["Groceries", "Utilities", "Transport", "Entertainment", "Salary", "Shopping", "Health", "Dining Out", "Transfer"];
export const vendors = Array.from({ length: 15 }, (_, i) => `Vendor ${i + 1}`);