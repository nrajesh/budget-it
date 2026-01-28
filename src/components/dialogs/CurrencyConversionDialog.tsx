import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2, RefreshCw } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface CurrencyConversionDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export const CurrencyConversionDialog: React.FC<CurrencyConversionDialogProps> = ({
    isOpen,
    onOpenChange,
}) => {
    const {
        selectedCurrency,
        exchangeRates,
        updateExchangeRate,
        refreshExchangeRates,
        availableCurrencies,
        currencySymbols
    } = useCurrency();

    const [isRefreshing, setIsRefreshing] = React.useState(false);

    // Calculate rates relative to selected currency for display
    const selectedCurrencyRateUSD = exchangeRates[selectedCurrency] || 1;

    const handleRateChange = (currencyCode: string, displayRate: number) => {
        // Convert display rate (Relative to Selected) back to USD-relative rate
        // Display = USD_Target / USD_Selected
        // USD_Target = Display * USD_Selected
        const newRateUSD = displayRate * selectedCurrencyRateUSD;
        updateExchangeRate(currencyCode, newRateUSD);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshExchangeRates();
            showSuccess("Exchange rates updated successfully.");
        } catch (error) {
            showError("Failed to update exchange rates. Please check your internet connection.");
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Currency Conversion</DialogTitle>
                    </div>
                    <DialogDescription>
                        Manage exchange rates relative to your base currency ({selectedCurrency}).
                        <br />
                        <span className="text-xs text-muted-foreground mt-1 block">
                            Rates sourced from <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-foreground">Frankfurter API</a> (ECB data). No tracking or API key involved.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between py-4 border-b">
                    <div className="text-sm font-medium">
                        Base: {selectedCurrency} (1.00)
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-3 w-3" />
                        )}
                        {isRefreshing ? "Refreshing..." : "Refresh Rates"}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 -mr-4">
                    <div className="space-y-4 py-4">
                        {availableCurrencies
                            .filter(c => c.code !== selectedCurrency)
                            .map((currency) => {
                                const rateUSD = exchangeRates[currency.code] || 1;
                                const rateRelativeToSelected = rateUSD / selectedCurrencyRateUSD;

                                return (
                                    <div key={currency.code} className="flex items-center justify-between gap-4 p-2 rounded-lg border bg-card">
                                        <div className="flex flex-col min-w-[120px]">
                                            <span className="font-semibold flex items-center gap-2">
                                                <span>{currencySymbols[currency.code]}</span>
                                                {currency.code}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{currency.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">1 {selectedCurrency} =</span>
                                            <Input
                                                type="number"
                                                className="w-24 text-right"
                                                value={rateRelativeToSelected.toFixed(4)}
                                                step="0.0001"
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val) && val > 0) {
                                                        handleRateChange(currency.code, val);
                                                    }
                                                }}
                                            />
                                            <span className="text-sm font-medium w-8">{currencySymbols[currency.code]}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
