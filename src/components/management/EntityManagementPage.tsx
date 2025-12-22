import React from 'react';
import { Payee } from '@/types/payee';

interface EntityManagementPageProps<T> {
  title: string;
  addPlaceholder: string;
  onAdd: (name: string) => Promise<void>;
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isImporting?: boolean;
  isLoading: boolean;
  data: T[];
  columns: any[];
  onDelete: (ids: string[]) => Promise<void>;
  isAccountContext: boolean;
  selectedEntity: T | null;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  handleEntityNameClick: (entity: T) => void;
  onSave: (entity: T) => Promise<void>;
}

const EntityManagementPage = <T extends Payee>({
  // ... props
}: EntityManagementPageProps<T>) => {
  // ... component implementation
};

export default EntityManagementPage;