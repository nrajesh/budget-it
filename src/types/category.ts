export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  total_transactions?: number; // Added by RPC function
}