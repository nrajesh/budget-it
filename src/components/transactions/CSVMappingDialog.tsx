import { useState, useEffect } from "react";
import Papa from "papaparse";
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
    file: File | null;
    requiredHeaders: string[];
    onConfirm: (results: any[], config: ImportConfig) => void;
}

export interface ImportConfig {
    delimiter: string;
    dateFormat: string;
    decimalSeparator: '.' | ',';
}

const CSVMappingDialog = ({
    isOpen,
    onClose,
    file,
    requiredHeaders,
    onConfirm,
}: CSVMappingDialogProps) => {
    const [step, setStep] = useState<'config' | 'mapping'>('config');
    const [config, setConfig] = useState<ImportConfig>({
        delimiter: ',',
        dateFormat: 'auto',
        decimalSeparator: '.',
    });

    // Parsed data state
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Reset when dialog opens
    useEffect(() => {
        if (isOpen) {
            setStep('config');
            setConfig({
                delimiter: ',',
                dateFormat: 'auto',
                decimalSeparator: '.',
            });
            setMapping({});
            setCsvHeaders([]);
            setCsvData([]);
        }
    }, [isOpen, file]);

    const handleParse = () => {
        if (!file) return;
        setIsLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: config.delimiter === 'auto' ? "" : config.delimiter, // Empty string = auto-detect
            complete: (results: any) => {
                const headers = results.meta.fields || [];
                setCsvHeaders(headers);
                setCsvData(results.data);

                // Pre-fill mapping if matches found
                const newMapping: Record<string, string> = {};
                requiredHeaders.forEach((required) => {
                    const match = headers.find(
                        (csv: string) => csv.toLowerCase() === required.toLowerCase()
                    );
                    if (match) newMapping[required] = match;
                });
                setMapping(newMapping);

                setStep('mapping');
                setIsLoading(false);
            },
            error: (error: any) => {
                console.error("CSV Parse Error", error);
                setIsLoading(false);
                // Ideally show toast here, but we can just stay on step 1?
            }
        });
    };

    const handleMappingChange = (required: string, value: string) => {
        setMapping((prev) => ({
            ...prev,
            [required]: value,
        }));
    };

    const handleConfirm = () => {
        // Apply mapping to data
        const mappedData = csvData.map((row: any) => {
            const newRow: any = {};
            Object.entries(mapping).forEach(([requiredHeader, csvHeader]) => {
                newRow[requiredHeader] = row[csvHeader];
            });
            return newRow;
        });

        onConfirm(mappedData, config);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{step === 'config' ? 'Import Settings' : 'Map Columns'}</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {step === 'config' && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>CSV Delimiter</Label>
                                <Select
                                    value={config.delimiter}
                                    onValueChange={(val) => setConfig(prev => ({ ...prev, delimiter: val }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=",">Comma (,)</SelectItem>
                                        <SelectItem value=";">Semicolon (;)</SelectItem>
                                        <SelectItem value="\t">Tab (\t)</SelectItem>
                                        {/* <SelectItem value="auto">Auto-detect</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Date Format (in CSV)</Label>
                                <Select
                                    value={config.dateFormat}
                                    onValueChange={(val) => setConfig(prev => ({ ...prev, dateFormat: val }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto-detect</SelectItem>
                                        <SelectItem value="d/M/yyyy">Day/Month/Year (e.g. 31/01/2024 or 1/1/2024)</SelectItem>
                                        <SelectItem value="M/d/yyyy">Month/Day/Year (e.g. 01/31/2024 or 1/1/2024)</SelectItem>
                                        <SelectItem value="yyyy-MM-dd">Year-Month-Day (e.g. 2024-01-31)</SelectItem>
                                        <SelectItem value="d.M.yyyy">Day.Month.Year (e.g. 31.01.2024)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Decimal Format</Label>
                                <Select
                                    value={config.decimalSeparator}
                                    onValueChange={(val: any) => setConfig(prev => ({ ...prev, decimalSeparator: val }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=".">1,234.56 (Dot decimal)</SelectItem>
                                        <SelectItem value=",">1.234,56 (Comma decimal)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Preview Area */}
                            <div className="border rounded-md p-3 bg-muted/30 mt-4">
                                <Label className="mb-2 block">Available Data Preview (First 3 rows)</Label>
                                {csvData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="text-xs w-full text-left">
                                            <thead>
                                                <tr className="border-b">
                                                    {csvHeaders.map(h => <th key={h} className="p-1 font-medium">{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvData.slice(0, 3).map((row, i) => (
                                                    <tr key={i} className="border-b last:border-0">
                                                        {csvHeaders.map(h => <td key={h} className="p-1 whitespace-nowrap">{row[h]}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground p-2 text-center">
                                        {isLoading ? "Reading..." : "No data properly parsed. Check delimiter."}
                                        <div className="mt-2">
                                            <Button variant="outline" size="sm" onClick={handleParse}>Refresh Preview</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'mapping' && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Map the columns from your CSV to the system fields.
                            </p>
                            <div className="grid gap-4">
                                {requiredHeaders.map((header) => (
                                    <div key={header} className="grid grid-cols-3 items-center gap-4">
                                        <Label className="col-span-1">{header}</Label>
                                        <div className="col-span-2">
                                            <Select
                                                value={mapping[header] || ""}
                                                onValueChange={(value) => handleMappingChange(header, value)}
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {step === 'config' ? (
                        <Button onClick={handleParse} disabled={!file || isLoading}>
                            {isLoading ? "Reading..." : "Next"}
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep('config')}>Back</Button>
                            <Button onClick={handleConfirm}>Import Transactions</Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CSVMappingDialog;
