import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext";

interface MissingCurrencyDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: string[];
    onConfirm: (currencies: Record<string, string>) => void;
    onCancel: () => void;
}

export const MissingCurrencyDialog: React.FC<MissingCurrencyDialogProps> = ({
    isOpen,
    onOpenChange,
    accounts,
    onConfirm,
    onCancel,
}) => {
    const { availableCurrencies } = useCurrency();
    const [currencyMap, setCurrencyMap] = React.useState<Record<string, string>>(
        {},
    );

    // Initialize with empty or default (e.g. USD) when accounts change
    React.useEffect(() => {
        if (isOpen) {
            const initial: Record<string, string> = {};
            accounts.forEach((acc) => {
                initial[acc] = "USD"; // Default
            });
            setCurrencyMap(initial);
        }
    }, [isOpen, accounts]);

    const handleCurrencyChange = (account: string, currency: string) => {
        setCurrencyMap((prev) => ({
            ...prev,
            [account]: currency,
        }));
    };

    const handleConfirm = () => {
        onConfirm(currencyMap);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Currency for New Accounts</DialogTitle>
                    <DialogDescription>
                        The following accounts are new and their currency could not be determined. Please select the correct currency for each.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    {accounts.map((account) => (
                        <div key={account} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={`currency-${account}`} className="col-span-2 truncate" title={account}>
                                {account}
                            </Label>
                            <div className="col-span-2">
                                <Select
                                    value={currencyMap[account] || "USD"}
                                    onValueChange={(value) => handleCurrencyChange(account, value)}
                                >
                                    <SelectTrigger id={`currency-${account}`}>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCurrencies.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.code} - {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>Confirm & Import</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
