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
  onConfirm: (results: Record<string, unknown>[], config: ImportConfig) => void;
}

export interface ImportConfig {
  delimiter: string;
  dateFormat: string;
  decimalSeparator: "." | ",";
  importMode: "append" | "replace";
}

const CSVMappingDialog = ({
  isOpen,
  onClose,
  file,
  requiredHeaders,
  onConfirm,
}: CSVMappingDialogProps) => {
  const [step, setStep] = useState<"config" | "mapping">("config");
  const [config, setConfig] = useState<ImportConfig>({
    delimiter: ",",
    dateFormat: "auto",
    decimalSeparator: ".",
    importMode: "append",
  });

  // Parsed data state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep("config");
      setConfig({
        delimiter: ",",
        dateFormat: "auto",
        decimalSeparator: ".",
        importMode: "append",
      });
      setMapping({});
      setCsvHeaders([]);
      setCsvData([]);
    }
  }, [isOpen, file]);

  const handleParse = (shouldAdvanceStart: boolean = false) => {
    if (!file) return;
    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      delimiter: config.delimiter === "auto" ? "" : config.delimiter, // Empty string = auto-detect
      complete: (results) => {
        const headers: string[] = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvData(results.data as Record<string, unknown>[]);

        // Pre-fill mapping if matches found
        const ALIASES: Record<string, string[]> = {
          Payee: ["Vendor", "Counterparty", "Merchant", "Description", "Party"],
          Subcategory: ["Sub-Category", "Sub Category", "Sub_Category"],
          Notes: ["Remarks", "Description", "Memo", "Details", "Comment"],
          Account: ["Account Name", "Wallet"],
          Amount: ["Value", "Cost", "Total"],
          Date: ["Txn Date", "Transaction Date", "Day"],
          Currency: ["Curr", "Cur", "Code"],
        };

        const newMapping: Record<string, string> = {};

        requiredHeaders.forEach((required) => {
          const lowerRequired = required.toLowerCase();
          const aliases = ALIASES[required] || [];
          const searchTerms = [
            lowerRequired,
            ...aliases.map((a) => a.toLowerCase()),
          ];

          // Find first match in headers that matches any search term
          const match = headers.find((header) => {
            const h = header.trim().toLowerCase();
            return searchTerms.includes(h);
          });

          if (match) newMapping[required] = match;
        });
        setMapping(newMapping);

        // Auto-detect decimal separator based on "Amount" column data
        const amountHeader = newMapping["Amount"];
        if (amountHeader) {
          const sampleValues = (results.data as Record<string, unknown>[])
            .slice(0, 5)
            .map((row) => row[amountHeader])
            .filter(Boolean) as string[];
          const hasComma = sampleValues.some(
            (val: string) => val.includes(",") && !val.includes("."),
          );
          const hasCommaDecimal = sampleValues.some(
            (val: string) =>
              /^\d+,\d{2}$/.test(val.replace(/[^\d,]/g, "")) ||
              /-\d+,\d{2}$/.test(val.replace(/[^\d,-]/g, "")),
          );

          if (hasComma || hasCommaDecimal) {
            setConfig((prev) => ({ ...prev, decimalSeparator: "," }));
          }
        }

        if (shouldAdvanceStart) {
          setStep("mapping");
        }
        setIsLoading(false);
      },
      error: (error) => {
        console.error("CSV Parse Error", error);
        setIsLoading(false);
        // Ideally show toast here, but we can just stay on step 1?
      },
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
    const mappedData = csvData.map((row) => {
      // Keep original data, then overwrite with standardized keys
      const newRow: Record<string, unknown> = { ...row };
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
          <DialogTitle>
            {step === "config" ? "Import Settings" : "Map Columns"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {step === "config" && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>CSV Delimiter</Label>
                <Select
                  value={config.delimiter}
                  onValueChange={(val) =>
                    setConfig((prev) => ({ ...prev, delimiter: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  onValueChange={(val) =>
                    setConfig((prev) => ({ ...prev, dateFormat: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="d/M/yyyy">
                      Day/Month/Year (e.g. 31/01/2024 or 1/1/2024)
                    </SelectItem>
                    <SelectItem value="M/d/yyyy">
                      Month/Day/Year (e.g. 01/31/2024 or 1/1/2024)
                    </SelectItem>
                    <SelectItem value="yyyy-MM-dd">
                      Year-Month-Day (e.g. 2024-01-31)
                    </SelectItem>
                    <SelectItem value="d.M.yyyy">
                      Day.Month.Year (e.g. 31.01.2024)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Decimal Format</Label>
                <Select
                  value={config.decimalSeparator}
                  onValueChange={(val: ImportConfig["decimalSeparator"]) =>
                    setConfig((prev) => ({ ...prev, decimalSeparator: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=".">1,234.56 (Dot decimal)</SelectItem>
                    <SelectItem value=",">1.234,56 (Comma decimal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Import Mode</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="append"
                      name="importMode"
                      value="append"
                      checked={config.importMode !== "replace"}
                      onChange={() =>
                        setConfig((prev) => ({ ...prev, importMode: "append" }))
                      }
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label
                      htmlFor="append"
                      className="font-normal cursor-pointer"
                    >
                      Append to existing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="replace"
                      name="importMode"
                      value="replace"
                      checked={config.importMode === "replace"}
                      onChange={() =>
                        setConfig((prev) => ({
                          ...prev,
                          importMode: "replace",
                        }))
                      }
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label
                      htmlFor="replace"
                      className="font-normal cursor-pointer"
                    >
                      Replace existing
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {config.importMode === "replace"
                    ? "Warning: This will delete ALL existing transactions before importing."
                    : "New transactions will be added to your existing data."}
                </p>
              </div>

              {/* Preview Area */}
              <div className="border rounded-md p-3 bg-muted/30 mt-4">
                <Label className="mb-2 block">
                  Available Data Preview (First 3 rows)
                </Label>
                {csvData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full text-left">
                      <thead>
                        <tr className="border-b">
                          {csvHeaders.map((h) => (
                            <th key={h} className="p-1 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-b last:border-0">
                            {csvHeaders.map((h) => (
                              <td key={h} className="p-1 whitespace-nowrap">
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground p-2 text-center">
                    {isLoading
                      ? "Reading..."
                      : "No data properly parsed. Check delimiter."}
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleParse(false)}
                      >
                        Refresh Preview
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Map the columns from your CSV to the system fields.
              </p>
              <div className="grid gap-4">
                {requiredHeaders.map((header) => (
                  <div
                    key={header}
                    className="grid grid-cols-3 items-center gap-4"
                  >
                    <Label className="col-span-1">{header}</Label>
                    <div className="col-span-2">
                      <Select
                        value={mapping[header] || ""}
                        onValueChange={(value) =>
                          handleMappingChange(header, value)
                        }
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {step === "config" ? (
            <Button
              onClick={() => handleParse(true)}
              disabled={!file || isLoading}
            >
              {isLoading ? "Reading..." : "Next"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("config")}>
                Back
              </Button>
              <Button onClick={handleConfirm}>Import Transactions</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CSVMappingDialog;
