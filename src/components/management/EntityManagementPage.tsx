import React from 'react';

interface Entity {
  id: string;
  name: string;
  // Add other common properties that both Payee and Category have
}

interface EntityManagementPageProps<T extends Entity> {
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

const EntityManagementPage = <T extends Entity>({
  title,
  addPlaceholder,
  onAdd,
  onFileChange,
  isImporting,
  isLoading,
  data,
  columns,
  onDelete,
  isAccountContext,
  selectedEntity,
  isDialogOpen,
  setIsDialogOpen,
  handleEntityNameClick,
  onSave,
}: EntityManagementPageProps<T>) => {
  // Component implementation
  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default EntityManagementPage;