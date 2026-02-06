
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ledger } from '@/types/dataProvider';
import { useDataProvider } from '@/context/DataProviderContext';
import { useCurrency } from '@/contexts/CurrencyContext';
// import { db } from '@/lib/dexieDB'; // Unused if accessing via dataProvider only

interface LedgerContextType {
    activeLedger: Ledger | null;
    ledgers: Ledger[];
    isLoading: boolean;
    switchLedger: (ledgerId: string) => Promise<void>;
    createLedger: (name: string, currency: string, icon?: string, shortName?: string, startFromScratch?: boolean) => Promise<void>;
    updateLedgerDetails: (ledgerId: string, updates: Partial<Ledger>) => Promise<void>;
    deleteLedger: (ledgerId: string) => Promise<void>;
    refreshLedgers: () => Promise<void>;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const LedgerProvider = ({ children }: { children: ReactNode }) => {
    const dataProvider = useDataProvider();
    const { setCurrency } = useCurrency();
    const [activeLedger, setActiveLedger] = useState<Ledger | null>(null);
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshLedgers = async () => {
        // We use dataProvider directly or db? dataProvider has getLedgers
        // But dataProvider interface might not be updated in the context wrapper yet?
        // Casting for now if TS complains, or assume it works since we updated LocalDataProvider
        // and strict typing might need interface update in DataProviderContext too maybe?
        // Let's assume usage of dataProvider as `any` or cast
        const displayLedgers = await (dataProvider as any).getLedgers(); // Cast until Context type updated
        setLedgers(displayLedgers);
        return displayLedgers;
    };

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const allLedgers = await refreshLedgers();

            // Check LocalStorage for last active
            const storedLedgerId = localStorage.getItem('activeLedgerId');

            let ledgerToUse = null;

            if (storedLedgerId) {
                ledgerToUse = allLedgers.find((l: Ledger) => l.id === storedLedgerId);
            }

            if (!ledgerToUse && allLedgers.length > 0) {
                const isLoggedOut = localStorage.getItem('userLoggedOut');
                if (!isLoggedOut) {
                    // Default to most recently accessed only if not logged out
                    ledgerToUse = allLedgers[0];
                }
            }

            if (!ledgerToUse && allLedgers.length === 0) {
                // Do not create default ledger automatically. 
                // User must create one via LedgerEntryPage.
                setActiveLedger(null);
            }

            if (ledgerToUse) {
                setActiveLedger(ledgerToUse);
                localStorage.setItem('activeLedgerId', ledgerToUse.id);

                // Sync global currency with ledger currency
                if (ledgerToUse.currency) {
                    setCurrency(ledgerToUse.currency);
                }

                // Update last_accessed async
                (dataProvider as any).updateLedger({
                    ...ledgerToUse,
                    last_accessed: new Date().toISOString()
                });
            }

            setIsLoading(false);
        };

        init();
    }, [dataProvider, setCurrency]);

    const switchLedger = async (ledgerId: string) => {
        const target = ledgers.find(l => l.id === ledgerId);
        if (target) {
            setActiveLedger(target);
            localStorage.setItem('activeLedgerId', target.id);
            await (dataProvider as any).updateLedger({
                ...target,
                last_accessed: new Date().toISOString()
            });

            // Sync global currency with ledger currency (Force update localStorage before reload)
            if (target.currency) {
                localStorage.setItem('selectedCurrency', target.currency);
            }

            // Clear filters to prevent crossing the streams (ghostbusters style)
            // We keep dateRange and maybe sortOrder, but clear entity selections
            localStorage.removeItem('filter_selectedAccounts');
            localStorage.removeItem('filter_selectedCategories');
            localStorage.removeItem('filter_selectedSubCategories');
            localStorage.removeItem('filter_selectedVendors');
            localStorage.removeItem('filter_searchTerm');

            // Clear logout flag as we are now entering a ledger
            localStorage.removeItem('userLoggedOut');

            // Force reload of page to clean context states (transcations etc)
            // Use href = '/' to ensure we navigate to root (Dashboard) and hard reload
            window.location.href = '/';
        }
    };

    const createLedger = async (name: string, currency: string, icon?: string, shortName?: string /*, startFromScratch: boolean = true */) => {
        const newLedger = await (dataProvider as any).addLedger({
            name,
            currency,
            icon,
            short_name: shortName
        });

        // if (!startFromScratch) { ... }

        await refreshLedgers();
        await switchLedger(newLedger.id);
    };

    const updateLedgerDetails = async (ledgerId: string, updates: Partial<Ledger>) => {
        const target = ledgers.find(l => l.id === ledgerId);
        if (target) {
            const updated = { ...target, ...updates };
            await (dataProvider as any).updateLedger(updated);
            await refreshLedgers();
            if (activeLedger?.id === ledgerId) {
                setActiveLedger(updated);
            }
        }
    };

    const deleteLedger = async (ledgerId: string) => {
        await (dataProvider as any).deleteLedger(ledgerId);
        await refreshLedgers();
        if (activeLedger?.id === ledgerId) {
            setActiveLedger(null);
            localStorage.removeItem('activeLedgerId');
            window.location.reload();
        }
    };

    return (
        <LedgerContext.Provider value={{
            activeLedger,
            ledgers,
            isLoading,
            switchLedger,
            createLedger,
            updateLedgerDetails,
            deleteLedger,
            refreshLedgers
        }}>
            {children}
        </LedgerContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLedger = () => {
    const context = useContext(LedgerContext);
    if (context === undefined) {
        throw new Error('useLedger must be used within a LedgerProvider');
    }
    return context;
};
