import { useState, useRef } from 'react';
import { useLedger } from '@/contexts/LedgerContext';
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from '@/components/ThemedCard';
import { Building2, Home, Globe, Baby, Wallet, Landmark, Plus, Upload } from "lucide-react";
import { ManageLedgerDialog } from '@/components/dialogs/ManageLedgerDialog';
import { useDataProvider } from "@/context/DataProviderContext";
import { decryptData } from "@/utils/crypto";
import { showSuccess, showError } from "@/utils/toast";
import PasswordDialog from "@/components/dialogs/PasswordDialog";
import { Button } from "@/components/ui/button";


const LedgerEntryPage = () => {
    const { ledgers, switchLedger, refreshLedgers } = useLedger();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Import Logic State
    const dataProvider = useDataProvider();
    const [isImportPasswordOpen, setIsImportPasswordOpen] = useState(false);
    const [tempImportFile, setTempImportFile] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (!content) return;

            try {
                // Optimize: Parse once
                const parsed = JSON.parse(content);

                if (parsed.ciphertext && parsed.iv && parsed.salt) {
                    // It's encrypted
                    setTempImportFile(content);
                    setIsImportPasswordOpen(true);
                } else {
                    // Assume plain text
                    await dataProvider.importData(parsed);
                    showSuccess("Data imported successfully!");

                    // Instant refresh instead of reload
                    await refreshLedgers();
                }
            } catch {
                showError("Invalid file format.");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = "";
    };

    const handleImportEncryptedParams = async (password: string) => {
        if (!tempImportFile) return;
        try {
            const decryptedParams = await decryptData(tempImportFile, password);
            const data = JSON.parse(decryptedParams);
            await dataProvider.importData(data);
            showSuccess("Encrypted data imported successfully!");
            setTempImportFile(null);

            // Instant refresh instead of reload
            await refreshLedgers();
        } catch (e: any) {
            showError(`Import failed: ${e.message}`);
        }
    };


    const handleSelectLedger = async (id: string) => {
        // Clear logout flag BEFORE switching, as switching triggers a reload
        localStorage.removeItem('userLoggedOut');
        await switchLedger(id);
        // navigate('/') is technically redundant if switchLedger does a hard reload to '/', 
        // but kept for safety in case switchLedger behavior changes to soft-switch.
        // However, with window.location.href='/', this line won't be reached in that case.
    };

    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'home': return <Home className="h-6 w-6" />;
            case 'globe': return <Globe className="h-6 w-6" />;
            case 'baby': return <Baby className="h-6 w-6" />;
            case 'wallet': return <Wallet className="h-6 w-6" />;
            case 'landmark': return <Landmark className="h-6 w-6" />;
            default: return <Building2 className="h-6 w-6" />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">Budget It!</h1>
                    <p className="text-lg text-muted-foreground">Select a budget ledger to continue.</p>
                </div>

                <div className={ledgers.length === 0
                    ? "flex justify-center"
                    : "grid grid-cols-1 md:grid-cols-2 gap-4"
                }>
                    {ledgers.map((ledger) => (
                        <ThemedCard
                            key={ledger.id}
                            className="cursor-pointer hover:border-primary/50 transition-all hover:bg-accent/50 group bg-card"
                            onClick={() => handleSelectLedger(ledger.id)}
                        >
                            <ThemedCardHeader className="flex flex-row items-center gap-4 pb-2 space-y-0">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
                                    {getIcon(ledger.icon)}
                                </div>
                                <div>
                                    <ThemedCardTitle className="text-xl">{ledger.name}</ThemedCardTitle>
                                    <ThemedCardDescription className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded-sm inline-block mt-1">
                                        {ledger.currency}
                                    </ThemedCardDescription>
                                </div>
                            </ThemedCardHeader>
                            <ThemedCardContent>
                                <p className="text-sm text-muted-foreground">
                                    {ledger.short_name ? `(${ledger.short_name})` : ''}
                                    Last accessed: {ledger.last_accessed ? new Date(ledger.last_accessed).toLocaleDateString() : 'Never'}
                                </p>
                            </ThemedCardContent>
                        </ThemedCard>
                    ))}

                    <ThemedCard
                        className={`cursor-pointer border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center p-6 min-h-[140px] ${ledgers.length === 0 ? "max-w-md w-full" : ""
                            }`}
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                            <Plus className="h-8 w-8" />
                            <span className="font-semibold">Create New Ledger</span>
                        </div>
                    </ThemedCard>
                </div>

                {/* Import Backup Controls */}
                {ledgers.length === 0 && (
                    <div className="w-full flex justify-center mt-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json,.lock"
                        />
                        <Button variant="ghost" className="text-muted-foreground hover:text-primary" onClick={handleImportClick}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Backup (JSON / Encrypted)
                        </Button>
                    </div>
                )}

                {ledgers.length > 0 && (
                    <div className="flex justify-center pt-8">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json,.lock"
                        />
                        <Button variant="outline" size="sm" onClick={handleImportClick} className="text-muted-foreground hover:text-primary">
                            <Upload className="mr-2 h-4 w-4" />
                            Import Backup
                        </Button>
                    </div>
                )}
            </div>

            <ManageLedgerDialog
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            <PasswordDialog
                isOpen={isImportPasswordOpen}
                onOpenChange={setIsImportPasswordOpen}
                onConfirm={handleImportEncryptedParams}
                title="Decrypt Backup"
                description="This file is encrypted. Please enter the password to restore your data."
                confirmText="Decrypt & Import"
            />

        </div>
    );
};

export default LedgerEntryPage;
