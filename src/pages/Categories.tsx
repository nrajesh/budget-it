import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/category';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { ColumnDefinition } from '@/components/management/EntityTable';

const CategoriesPage: React.FC = () => {
  const managementProps = useCategoryManagement();

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_categories_with_transaction_counts', {
        user_id_param: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
      return data;
    },
  });

  const columns: ColumnDefinition<Category>[] = [
    {
      key: "name",
      header: "Name",
      accessor: (item) => item.name,
      cellRenderer: (item) => (
        <div onClick={() => managementProps.handleCategoryNameClick?.(item.name)} className="cursor-pointer hover:text-primary hover:underline">
          {item.name}
        </div>
      ),
    },
    {
      key: "total_transactions",
      header: "Transactions",
      accessor: (item) => item.total_transactions?.toString() || '0',
    },
  ];

  // ... rest of the component implementation
};

export default CategoriesPage;