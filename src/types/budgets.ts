export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface SubCategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  sub_category_id?: string | null;
  sub_category_name?: string | null;
  target_amount: number;
  spent_amount: number;
  currency: string;
  start_date: string;
  end_date: string | null;
  frequency: "Monthly" | "Quarterly" | "Yearly" | "One-time";
  account_scope?: "ALL" | "GROUP";
  account_scope_values?: string[] | null;
  is_active?: boolean;
  is_goal?: boolean;
  target_date?: string | null;
  monthly_contribution?: number | null;
  goal_context?: string | null;
  budget_scope?: "category" | "account" | "vendor" | "sub_category";
  budget_scope_name?: string | null;
}
