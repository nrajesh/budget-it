import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLedger } from "@/contexts/LedgerContext";
import { useToast } from "@/components/ui/use-toast";
import { Ledger } from "@/types/dataProvider";
import { Building2, Home, Globe, Baby, Wallet, Landmark } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    short_name: z.string().max(6, "Short name must be 6 characters or less.").optional(),
    icon: z.string().optional(),
    currency: z.string().min(3, "Currency code is required"),
});

interface ManageLedgerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    ledgerToEdit?: Ledger; // If null, create new
}

export function ManageLedgerDialog({
    isOpen,
    onOpenChange,
    ledgerToEdit,
}: ManageLedgerDialogProps) {
    const { createLedger, updateLedgerDetails, deleteLedger, ledgers } = useLedger();
    const { toast } = useToast();
    const isEditing = !!ledgerToEdit;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            short_name: "",
            icon: "building",
            currency: "EUR",
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (ledgerToEdit) {
                form.reset({
                    name: ledgerToEdit.name,
                    short_name: ledgerToEdit.short_name || "",
                    icon: ledgerToEdit.icon || "building",
                    currency: ledgerToEdit.currency,
                });
            } else {
                form.reset({
                    name: "",
                    short_name: "",
                    icon: "building",
                    currency: "EUR",
                });
            }
        }
    }, [isOpen, ledgerToEdit, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Check for duplicate name
            const normalizedName = values.name.trim().toLowerCase();
            const duplicate = ledgers.find(l =>
                l.name.trim().toLowerCase() === normalizedName &&
                l.id !== ledgerToEdit?.id
            );

            if (duplicate) {
                form.setError("name", {
                    type: "manual",
                    message: "A ledger with this name already exists."
                });
                return;
            }

            if (isEditing && ledgerToEdit) {
                await updateLedgerDetails(ledgerToEdit.id, values);
                toast({ title: "Ledger updated" });
            } else {
                await createLedger(values.name, values.currency, values.icon, values.short_name);
                toast({ title: "Ledger created" });
            }
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Error saving ledger", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!ledgerToEdit) return;
        if (confirm("Are you sure you want to delete this ledger? This will hide it but retain data for recovery (soft delete implementation dependent).")) {
            try {
                await deleteLedger(ledgerToEdit.id);
                toast({ title: "Ledger deleted" });
                onOpenChange(false);
            } catch {
                toast({ title: "Error deleting ledger", variant: "destructive" });
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Ledger" : "Create New Ledger"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your budget ledger details." : "Add a new separate budget ledger."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ledger Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Home Budget" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className={isEditing ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                            <FormField
                                control={form.control}
                                name="short_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Short Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Home" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {!isEditing && (
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Default Currency</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Currency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="icon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Icon</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Icon" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="building">
                                                <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Building</div>
                                            </SelectItem>
                                            <SelectItem value="home">
                                                <div className="flex items-center gap-2"><Home className="h-4 w-4" /> Home</div>
                                            </SelectItem>
                                            <SelectItem value="globe">
                                                <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> Globe</div>
                                            </SelectItem>
                                            <SelectItem value="baby">
                                                <div className="flex items-center gap-2"><Baby className="h-4 w-4" /> Child</div>
                                            </SelectItem>
                                            <SelectItem value="wallet">
                                                <div className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Wallet</div>
                                            </SelectItem>
                                            <SelectItem value="landmark">
                                                <div className="flex items-center gap-2"><Landmark className="h-4 w-4" /> Bank</div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            {isEditing && (
                                <Button type="button" variant="destructive" onClick={handleDelete} className="mr-auto">
                                    Delete
                                </Button>
                            )}
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
