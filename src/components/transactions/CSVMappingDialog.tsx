import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CSVMappingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    csvHeaders: string[];
    requiredHeaders: string[];
    onConfirm: (mapping: Record<string, string>) => void;
}

const CSVMappingDialog = ({
    isOpen,
    onClose,
    csvHeaders,
    requiredHeaders,
    onConfirm,
}: CSVMappingDialogProps) => {
    const [mapping, setMapping] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            const newMapping: Record<string, string> = {};
            requiredHeaders.forEach((required) => {
                // Try to find a matching header in CSV (case-insensitive)
                const match = csvHeaders.find(
                    (csv) => csv.toLowerCase() === required.toLowerCase()
                );
                if (match) {
                    newMapping[required] = match;
                }
            });
            setMapping(newMapping);
        }
    }, [isOpen, csvHeaders, requiredHeaders]);

    const handleChange = (required: string, value: string) => {
        setMapping((prev) => ({
            ...prev,
            [required]: value,
        }));
    };

    const handleConfirm = () => {
        onConfirm(mapping);
        onClose();
    };

    // Check if all critical fields are mapped? 
    // For now, we allow partial mapping if the user intends it, 
    // but let's assume all required headers MUST be mapped to something or explicitly skipped?
    // The system seems to require them. 
    // Let's just allow the user to proceed; validation will happen in the main flow if something is missing.

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Map CSV Columns</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Your CSV headers don't match the required format. Please map the columns below.
                    </p>
                    <div className="grid gap-4">
                        {requiredHeaders.map((header) => (
                            <div key={header} className="grid grid-cols-2 items-center gap-4">
                                <Label>{header}</Label>
                                <Select
                                    value={mapping[header] || ""}
                                    onValueChange={(value) => handleChange(header, value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {csvHeaders.map((csvHeader) => (
                                            <SelectItem key={csvHeader} value={csvHeader}>
                                                {csvHeader}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>Import</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CSVMappingDialog;
