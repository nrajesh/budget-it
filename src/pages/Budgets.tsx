"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  currency: string;
  target_amount: number;
  start_date: string;
  frequency: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const fetchBudgets = async (): Promise<Budget[]> => {
  const { data, error } = await supabase.from("budgets").select("*");
  if (error) throw new Error(error.message);
  return data;
};

const fetchCategories = async (userId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data;
};

const Budgets = () => {
  const queryClient = useQueryClient();
  const [selectedBudgetIds, setSelectedBudgetIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  const { data: budgets, isLoading, error } = useQuery<Budget[], Error>({
    queryKey: ["budgets"],
    queryFn: fetchBudgets,
    enabled: !!userId,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[], Error>({
    queryKey: ["categories", userId],
    queryFn: () => fetchCategories(userId!),
    enabled: !!userId,
  });

  const categoryMap = new Map(categories?.map((cat) => [cat.id, cat.name]));

  const toggleBudgetSelection = (id: string) => {
    setSelectedBudgetIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (budgets && selectedBudgetIds.size === budgets.length) {
      setSelectedBudgetIds(new Set());
    } else if (budgets) {
      setSelectedBudgetIds(new Set(budgets.map((budget) => budget.id)));
    }
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedBudgetIds.size === 0) return;

    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .in("id", Array.from(selectedBudgetIds));

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`${selectedBudgetIds.size} budget(s) deleted successfully.`);
      setSelectedBudgetIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    } catch (err: any) {
      toast.error(`Error deleting budgets: ${err.message}`);
    }
  }, [selectedBudgetIds, queryClient]);

  if (isLoading || isLoadingCategories) return <div>Loading budgets...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Budgets</h1>

      {selectedBudgetIds.size > 0 && (
        <div className="mb-4 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Selected ({selectedBudgetIds.size})</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the selected budgets.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {budgets && budgets.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedBudgetIds.size === budgets.length && budgets.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Target Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedBudgetIds.has(budget.id)}
                      onCheckedChange={() => toggleBudgetSelection(budget.id)}
                      aria-label={`Select budget ${categoryMap.get(budget.category_id) || budget.category_id}`}
                    />
                  </TableCell>
                  <TableCell>{categoryMap.get(budget.category_id) || budget.category_id}</TableCell>
                  <TableCell>{budget.target_amount}</TableCell>
                  <TableCell>{budget.currency}</TableCell>
                  <TableCell>{format(new Date(budget.start_date), "PPP")}</TableCell>
                  <TableCell>{budget.frequency}</TableCell>
                  <TableCell>{budget.end_date ? format(new Date(budget.end_date), "PPP") : "N/A"}</TableCell>
                  <TableCell>{budget.is_active ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-gray-500">No budgets found. Start by adding a new budget!</p>
      )}
    </div>
  );
};

export default Budgets;