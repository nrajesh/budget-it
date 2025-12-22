import { useState, useRef, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Payee } from "@/types/payee";

interface UsePayeeManagementProps {
  initialData?: Payee[];
  onImportComplete?: () => void;
  isAccount?: boolean;
}

export const usePayeeManagement = ({ initialData = [], onImportComplete, isAccount = false }: UsePayeeManagementProps = {}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingMutation, setIsLoadingMutation] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Payee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim() !== '');

        // Skip header row if it exists
        const dataLines = lines.length > 0 && lines[0].includes('name') ? lines.slice(1) : lines;

        if (dataLines.length === 0) {
          toast({
            title: "No data found",
            description: "The CSV file doesn't contain any valid data to import.",
            variant: "destructive",
          });
          return;
        }

        const payeesToInsert = dataLines.map(line => {
          const [name] = line.split(',');
          return { name: name.trim() };
        });

        const { error } = await supabase.rpc('batch_upsert_vendors', {
          p_names: payeesToInsert.map(p => p.name)
        });

        if (error) throw error;

        toast({
          title: "Import successful",
          description: `${payeesToInsert.length} payees were imported successfully.`,
        });

        queryClient.invalidateQueries({ queryKey: ['payees'] });
        onImportComplete?.();
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing the CSV file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [fileInputRef, onImportComplete, queryClient, toast]);

  const handlePayeeNameClick = (name: string) => {
    // Implementation for handling payee name click
    console.log(`Payee clicked: ${name}`);
  };

  return {
    isImporting,
    setIsImporting,
    isLoadingMutation,
    selectedRows,
    setSelectedRows,
    isConfirmOpen,
    setIsConfirmOpen,
    isDialogOpen,
    setIsDialogOpen,
    selectedEntity,
    setSelectedEntity,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    fileInputRef,
    handleFileChange,
    handlePayeeNameClick,
  };
};