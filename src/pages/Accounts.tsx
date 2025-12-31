import React, { useState, useMemo } from 'react';
import { ColumnDefinition } from '@/components/management/EntityTable';
import EntityManagementPage from '@/components/management/EntityManagementPage';
import { useAccounts } from '@/hooks/useAccounts';
import { Account, AccountUpsertType } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { parseAccountsCsv } from '@/lib/csv';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

// Placeholder for AddEditAccountDialog (assuming it exists or will be created later)
const AddEditAccountDialog = () => null; 

const AccountsPage: React.FC = () => {
  const { accounts, isLoading, refetch } = useAccounts();
  
  // State for EntityManagementPage
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Account; direction: 'asc' | 'desc' } | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Account | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // --- Data Filtering, Sorting, and Pagination (Client-side for simplicity) ---
  const filteredData = useMemo(() => {
    let filtered = accounts;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        account.currency.toLowerCase().includes(lowerCaseSearchTerm) ||
        account.remarks?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [accounts, searchTerm, sortConfig, currentPage, itemsPerPage]);

  // --- Handlers ---

  const handleAddClick = () => {
    setSelectedEntity(null);
    // Logic to open AddEditAccountDialog
  };

  const handleEditClick = (account: Account) => {
    setSelectedEntity(account);
    // Logic to open AddEditAccountDialog
  };

  const handleDeleteClick = (account: Account | null) => {
    setSelectedEntity(account);
  };

  const confirmDelete = async () => {
    if (!selectedEntity) return;
    
    // Note: Deleting an account requires deleting the associated vendor entry.
    const toastId = toast.loading(`Deleting account: ${selectedEntity.name}...`);
    
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', selectedEntity.id);

    if (error) {
      toast.error(`Failed to delete account: ${error.message}`, { id: toastId });
    } else {
      toast.success(`Account "${selectedEntity.name}" deleted successfully.`, { id: toastId });
      refetch();
    }
    setSelectedEntity(null);
  };

  const handleBulkDeleteClick = () => {
    // Implementation needed if bulk delete is required
    console.log("Bulk delete clicked for IDs:", selectedIds);
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => 
      checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)
    );
  };

  const handleExportClick = () => {
    // Export logic placeholder
    toast.info("Export functionality is not yet implemented.");
  };

  const handleImport = async (file: File) => {
    const toastId = toast.loading("Parsing CSV file...");
    try {
      const accountsToUpsert: AccountUpsertType[] = await parseAccountsCsv(file);
      
      if (accountsToUpsert.length === 0) {
        toast.dismiss(toastId);
        toast.error("No valid account data found in the CSV file.");
        return;
      }

      toast.loading(`Importing ${accountsToUpsert.length} accounts...`, { id: toastId });

      // Call the Supabase RPC function for batch upsert
      const { error } = await supabase.rpc('batch_upsert_accounts', {
        p_accounts: accountsToUpsert,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`${accountsToUpsert.length} accounts imported/updated successfully.`, { id: toastId });
      refetch();

    } catch (error) {
      console.error("Import error:", error);
      toast.error(`Import failed: ${(error as Error).message}`, { id: toastId });
    }
  };

  // --- Columns Definition ---
  const columns: ColumnDefinition<Account>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (row) => row.currency,
      sortable: true,
    },
    {
      key: 'starting_balance',
      header: 'Starting Balance',
      render: (row) => formatCurrency(row.starting_balance, row.currency),
      sortable: true,
    },
    {
      key: 'running_balance',
      header: 'Current Balance',
      render: (row) => formatCurrency(row.running_balance, row.currency),
      sortable: true,
    },
    {
      key: 'total_transactions',
      header: 'Transactions',
      render: (row) => row.total_transactions,
      sortable: true,
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (row) => row.remarks || '-',
      sortable: false,
    },
    {
      key: 'actions',
      header: 'Actions',
    },
  ], []);

  return (
    <>
      <EntityManagementPage<Account>
        title="Accounts Management"
        entityName="Account"
        entityNamePlural="Accounts"
        data={filteredData}
        isLoading={isLoading}
        columns={columns}
        AddEditDialogComponent={AddEditAccountDialog}
        selectedEntity={selectedEntity}
        handleAddClick={handleAddClick}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        confirmDelete={confirmDelete}
        handleBulkDeleteClick={handleBulkDeleteClick}
        handleSelectAll={handleSelectAll}
        handleRowSelect={handleRowSelect}
        handleImport={handleImport}
        handleExportClick={handleExportClick}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        refetch={refetch}
      />
      {/* AddEditAccountDialog implementation would go here */}
    </>
  );
};

export default AccountsPage;