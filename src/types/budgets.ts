export interface Budget {
  id: string;
  category_id: string;
  category_name: string;
  target_amount: number;
  spent_amount: number;
  currency: string;
  start_date: string;
  end_date: string | null;
  frequency: string;
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}