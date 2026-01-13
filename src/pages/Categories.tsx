import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { Category } from "@/data/finance-data";
import { ColumnDefinition } from "@/components/management/EntityTable";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { Input } from "@/components/ui/input";
import { useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import CategoryReconciliationDialog from "@/components/management/CategoryReconciliationDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

import ManageSubCategoriesDialog from "@/components/categories/ManageSubCategoriesDialog";

const CategoriesPage = () => {
  const { invalidateAllData, transactions } = useTransactions();
  const managementProps = useCategoryManagement();

  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [isReconcileOpen, setIsReconcileOpen] = React.useState(false);
  const [editedName, setEditedName] = React.useState<string>("");
  const [managingSubCategory, setManagingSubCategory] = React.useState<Category | null>(null);
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    else if (event.key === 'Escape') setEditingCategoryId(null);
  };

  // Pre-calculate sub-category counts to avoid running this per row render if it becomes expensive, 
  // though for decent list sizes useMemo in cellRenderer or here is fine.
  // Actually, let's just do it in the cellRenderer for simplicity as long as N is small.
  // Better: create a map.
  const subCategoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.sub_category) {
        if (!counts[t.category]) counts[t.category] = 0;
        // This is a rough count of total transactions with sub-categories, 
        // but we want count of UNIQUE sub-categories. 
      }
    });
    // Let's do unique set per category
    const uniqueSubs: Record<string, Set<string>> = {};
    transactions.forEach(t => {
      if (t.sub_category && t.category) {
        if (!uniqueSubs[t.category]) uniqueSubs[t.category] = new Set();
        uniqueSubs[t.category].add(t.sub_category);
      }
    });
    const finalCounts: Record<string, number> = {};
    Object.keys(uniqueSubs).forEach(cat => {
      finalCounts[cat] = uniqueSubs[cat].size;
    });
    return finalCounts;
  }, [transactions]);

  const columns: ColumnDefinition<Category>[] = [
    {
      header: "Name",
      accessor: "name",
      cellRenderer: (item) =>
        editingCategoryId === item.id ? (
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => handleSaveName(item.id, item.name)}
            onKeyDown={(e) => handleKeyDown(e)}
            disabled={updateCategoryNameMutation.isPending}
            className="h-8"
          />
        ) : (
          <div onClick={() => managementProps.handleCategoryNameClick(item.name)} className="cursor-pointer hover:text-primary hover:underline">
            {item.name}
          </div>
        ),
    },
    {
      header: "Sub-categories",
      accessor: (item) => subCategoryCounts[item.name] || 0,
      cellRenderer: (item) => {
        const count = subCategoryCounts[item.name] || 0;
        return (
          <div
            className="text-sm text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              setManagingSubCategory(item);
            }}
          >
            {count} {count === 1 ? 'sub-category' : 'sub-categories'}
          </div>
        );
      }
    },
    {
      header: "Transactions",
      accessor: "totalTransactions",
      cellRenderer: (item) => (
        <span className="text-sm font-medium">
          {item.totalTransactions || 0}
        </span>
      ),
    }
  ];

  return (
    <>
      <EntityManagementPage
        title="Categories"
        entityName="Category"
        entityNamePlural="categories"
        data={managementProps.categories}
        isLoading={managementProps.isLoadingCategories}
        columns={columns}
        isDeletable={(item) => item.name !== 'Others'}
        customEditHandler={startEditing}
        isEditing={id => editingCategoryId === id}
        isUpdating={updateCategoryNameMutation.isPending}
        // Pass all management props explicitly
        {...managementProps}
        selectedEntity={managementProps.selectedEntity}
        refetch={managementProps.refetchCategories}
        extraActions={
          <Button onClick={() => setIsReconcileOpen(true)} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reconcile
          </Button>
        }
      />
      <CategoryReconciliationDialog
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
      />
      <ManageSubCategoriesDialog
        isOpen={!!managingSubCategory}
        onOpenChange={(open) => !open && setManagingSubCategory(null)}
        category={managingSubCategory}
      />
    </>
  );
};

export default CategoriesPage;