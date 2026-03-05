import EntityManagementPage from "./EntityManagementPage";
import { ColumnDefinition } from "./EntityTable";
import { AIProvider } from "@/types/dataProvider";
import AddEditAIProviderDialog from "./AddEditAIProviderDialog";
import { useAIProviderManagement } from "@/hooks/useAIProviderManagement";
import { Badge } from "@/components/ui/badge";

const AIProviderManagement = () => {
    const managementProps = useAIProviderManagement();

    const columns: ColumnDefinition<AIProvider>[] = [
        {
            header: "Name",
            accessor: "name",
            cellRenderer: (item) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                    </span>
                    {item.isDefault && (
                        <Badge variant="secondary" className="text-[10px] h-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-none">
                            Default
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            header: "Type",
            accessor: "type",
            cellRenderer: (item) => (
                <Badge variant="outline" className="font-normal border-slate-200 dark:border-slate-800">
                    {item.type}
                </Badge>
            ),
        },
        {
            header: "Model",
            accessor: "model",
        },
        {
            header: "Endpoint",
            accessor: "baseUrl",
            cellRenderer: (item) => (
                <code className="text-xs text-muted-foreground break-all bg-slate-100 dark:bg-slate-800/50 px-1 py-0.5 rounded">
                    {item.baseUrl}
                </code>
            ),
        },
    ];

    return (
        <EntityManagementPage<AIProvider>
            title="AI Providers"
            subtitle="Manage your AI model endpoints and configurations"
            entityName="AI Provider"
            entityNamePlural="AI providers"
            data={managementProps.providers}
            columns={columns}
            AddEditDialogComponent={(props) => (
                <AddEditAIProviderDialog
                    {...props}
                    provider={managementProps.selectedProvider}
                    onSuccess={managementProps.refetch}
                />
            )}
            {...managementProps}
        />
    );
};

export default AIProviderManagement;
