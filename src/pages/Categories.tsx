import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { Category } from "@/types"; // Corrected import
import { ColumnDefinition } from "@/types";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { Input } from "@/components/ui/input";
import { useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const CategoriesPage = () => {
  const { invalidateAllData } = useTransactions();
  const managementProps = useCategoryManagement();

  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [editedName, setEditedName] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateCategoryNameMutation = useMutation({
    mutationFn: async ({ categoryId, newName }: { categoryId: string; newName: string }) => {
      const { error } = await supabase.from('categories').update({ name: newName.trim() }).eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: async () => {
      showSuccess("Category name updated successfully!");
      await invalidateAllData();
      setEditingCategoryId(null);
    },
    onError: (error: any) => showError(`Failed to update category name: ${error.message}`),
  });

  const startEditing = (category: { id: string; name: string }) => {
    setEditingCategoryId(category.id);
    setEditedName(category.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveName = (categoryId: string, originalName: string) => {
    if (editedName.trim() === "" || editedName === originalName) {
      setEditingCategoryId(null);
      return;
    }
    updateCategoryNameMutation.mutate({ categoryId, newName: editedName.trim() });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, category: { id: string; name: string }) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    else if (event.key === 'Escape') setEditingCategoryId(null);
  };

  const columns: ColumnDefinition<Category>[] = [
    {
      header: "Name",
      accessor: "name",
      render: (item) => // Changed cellRenderer to render
        editingCategoryId === item.id ? (
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => handleSaveName(item.id, item.name)}
            onKeyDown={(e) => handleKeyDown(e, item)}
            disabled={updateCategoryNameMutation.isPending}
            className="h-8"
          />
        ) : (
          <div onClick={() => managementProps.handleCategoryNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline">
            {item.name}
          </div>
        ),
    },
  ];

  return (
    <EntityManagementPage
      title="Categories"
      data={managementProps.categories}
      isLoading={managementProps.isLoadingCategories}
      columns={columns}
      searchTerm={managementProps.searchTerm}
      setSearchTerm={managementProps.setSearchTerm}
      onAddNew={managementProps.handleAddClick}
    />
  );
};

export default CategoriesPage;