import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { useDataProvider } from "@/context/DataProviderContext";
import { AIProvider } from "@/types/dataProvider";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["OPENAI", "GEMINI", "ANTHROPIC", "MISTRAL", "PERPLEXITY", "CUSTOM"]),
    baseUrl: z.string().url("Must be a valid URL"),
    model: z.string().min(1, "Model name is required"),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
});

interface AddEditAIProviderDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    provider?: AIProvider | null;
    onSuccess?: () => void;
}

const AddEditAIProviderDialog: React.FC<AddEditAIProviderDialogProps> = ({
    isOpen,
    onOpenChange,
    provider,
    onSuccess,
}) => {
    const dataProvider = useDataProvider();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "CUSTOM",
            baseUrl: "",
            model: "",
            description: "",
            isDefault: false,
        },
    });

    React.useEffect(() => {
        if (provider) {
            form.reset({
                name: provider.name,
                type: provider.type,
                baseUrl: provider.baseUrl,
                model: provider.model,
                description: provider.description || "",
                isDefault: provider.isDefault || false,
            });
        } else {
            form.reset({
                name: "",
                type: "CUSTOM",
                baseUrl: "",
                model: "",
                description: "",
                isDefault: false,
            });
        }
    }, [provider, form, isOpen]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (provider) {
                await dataProvider.updateAIProvider({
                    ...values,
                    id: provider.id,
                });
                showSuccess("AI Provider updated successfully!");
            } else {
                await dataProvider.addAIProvider(values);
                showSuccess("AI Provider added successfully!");
            }
            onSuccess?.();
            onOpenChange(false);
        } catch (error: unknown) {
            showError(
                `Error: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {provider ? "Edit" : "Add"} AI Provider
                    </DialogTitle>
                    <DialogDescription>
                        {provider
                            ? "Update the configuration for this AI model provider."
                            : "Add a new AI endpoint for auto-categorization."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provider Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Local Llama, Mistral Beta"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>API Type</FormLabel>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={field.value}
                                            onChange={field.onChange}
                                        >
                                            <option value="OPENAI">OpenAI</option>
                                            <option value="GEMINI">Google Gemini</option>
                                            <option value="ANTHROPIC">Anthropic</option>
                                            <option value="MISTRAL">Mistral</option>
                                            <option value="PERPLEXITY">Perplexity</option>
                                            <option value="CUSTOM">Custom (OpenAI Compatible)</option>
                                        </select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., gpt-4o, llama3"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="baseUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Base URL (Endpoint)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="https://api.openai.com/v1"
                                            {...field}
                                        />
                                    </FormControl>
                                    <p className="text-[10px] text-muted-foreground">
                                        Ensure this URL is allowed in the CSP or proxy if required.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Notes about this endpoint..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isDefault"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Set as default provider</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">Save Provider</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddEditAIProviderDialog;
