import { useState, useCallback, useRef, useEffect } from "react";
import { AIProvider } from "@/types/dataProvider";
import { useDataProvider } from "@/context/DataProviderContext";
import { showError, showSuccess } from "@/utils/toast";

export const useAIProviderManagement = () => {
  const dataProvider = useDataProvider();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    null,
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dataProvider.getAIProviders();
      setProviders(data);
    } catch (_error) {
      showError("Failed to fetch AI providers");
    } finally {
      setIsLoading(false);
    }
  }, [dataProvider]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleAddClick = () => {
    setSelectedProvider(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProvider) return;
    try {
      await dataProvider.deleteAIProvider(selectedProvider.id);
      showSuccess("Provider deleted successfully");
      fetchProviders();
    } catch (_error) {
      showError("Failed to delete provider");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleBulkDeleteClick = async () => {
    try {
      for (const id of selectedRows) {
        await dataProvider.deleteAIProvider(id);
      }
      showSuccess(`Deleted ${selectedRows.length} providers`);
      setSelectedRows([]);
      fetchProviders();
    } catch (_error) {
      showError("Failed to delete some providers");
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRows((prev) =>
      checked ? [...prev, id] : prev.filter((rowId) => rowId !== id),
    );
  };

  const handleSelectAll = (checked: boolean, currentItems: AIProvider[]) => {
    if (checked) {
      const allIds = currentItems.map((item) => item.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleExportClick = (items: AIProvider[]) => {
    const csvData = items.map((p) => ({
      Name: p.name,
      Type: p.type,
      Endpoint: p.baseUrl,
      Model: p.model,
      Description: p.description || "",
    }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Name,Type,Endpoint,Model,Description"].join(",") +
      "\n" +
      csvData.map((e) => Object.values(e).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ai_providers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    providers,
    isLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    isDialogOpen,
    setIsDialogOpen,
    selectedProvider,
    isConfirmOpen,
    setIsConfirmOpen,
    selectedRows,
    fileInputRef,
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    confirmDelete,
    handleBulkDeleteClick,
    handleRowSelect,
    handleSelectAll,
    handleExportClick,
    refetch: fetchProviders,
    // Add missing required props for EntityManagementPage
    itemsPerPage: 10,
    isImporting: false,
    isLoadingMutation: false,
    handleImportClick: () => {},
    handleFileChange: () => {},
    selectedEntity: selectedProvider,
  };
};
