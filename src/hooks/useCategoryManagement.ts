import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/hooks/useUser';
import { createCategoriesService } from '@/services/categoriesService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Category } from '@/types/finance';
import Papa from 'papaparse';

export const useCategoryManagement = () => {
  const { user } = useUser();
  const { categories, isLoadingCategories, invalidateAllData } = useTransactions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const categoriesService = createCategoriesService(supabase, user?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

  const handleAdd = () => {
    setEditingCategory(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await categoriesService.deleteCategoriesBatch(ids);
      toast({ title: 'Success', description: `${ids.length} categories deleted.` });
      invalidateAllData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async (data: { name: string }) => {
    try {
      if (editingCategory?.id) {
        await categoriesService.updateCategory(editingCategory.id, data);
        toast({ title: 'Success', description: 'Category updated.' });
      } else {
        await categoriesService.addCategory(data);
        toast({ title: 'Success', description: 'Category added.' });
      }
      invalidateAllData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleImport = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importedCategories = results.data as { name: string }[];
        const categoryNames = importedCategories.map(c => c.name).filter(Boolean);
        try {
          await categoriesService.batchUpsertCategories(categoryNames);
          toast({ title: 'Import Successful', description: `${categoryNames.length} categories imported.` });
          invalidateAllData();
        } catch (error: any) {
          toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
        }
      },
    });
  };

  return {
    categories,
    isLoading: isLoadingCategories,
    isDialogOpen,
    setIsDialogOpen,
    editingCategory,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSave,
    handleImport,
  };
};