"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionDialog from "@/components/transactions/TransactionDialog";
import { useSession } from "@/hooks/useSession";
import Papa from "papaparse";

const Transactions = () => {
  const session = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // The exact headers required by the importer based on the error message
  const REQUIRED_HEADERS = [
    "Date",
    "Account",
    "Vendor",
    "Category",
    "Amount",
    "Remarks",
    "Currency",
    "Frequency",
    "End Date",
    "Transfer ID"
  ];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchTransactions();
    }
  }, [session?.user?.id]);

  const handleExport = () => {
    let dataToExport = transactions.map(t => ({
      "Date": t.date,
      "Account": t.account,
      "Vendor": t.vendor,
      "Category": t.category,
      "Amount": t.amount,
      "Remarks": t.remarks,
      "Currency": t.currency,
      "Frequency": t.recurrence_frequency || "",
      "End Date": t.recurrence_end_date || "",
      "Transfer ID": t.transfer_id || ""
    }));

    let fileName = "transactions.csv";

    if (transactions.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      const transferId1 = "TRF-SAME-" + Math.random().toString(36).substr(2, 4).toUpperCase();
      const transferId2 = "TRF-DIFF-" + Math.random().toString(36).substr(2, 4).toUpperCase();
      
      dataToExport = [
        {
          "Date": today,
          "Account": "Cash",
          "Vendor": "Starbucks",
          "Category": "Food & Drink",
          "Amount": -5.5,
          "Remarks": "Morning coffee",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": ""
        },
        {
          "Date": today,
          "Account": "Checking",
          "Vendor": "Employer",
          "Category": "Income",
          "Amount": 3000,
          "Remarks": "Monthly Salary",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": ""
        },
        // Same Currency Transfer
        {
          "Date": today,
          "Account": "Checking",
          "Vendor": "Transfer",
          "Category": "Transfer",
          "Amount": -500,
          "Remarks": "To Savings",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": transferId1
        },
        {
          "Date": today,
          "Account": "Savings",
          "Vendor": "Transfer",
          "Category": "Transfer",
          "Amount": 500,
          "Remarks": "From Checking",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": transferId1
        },
        // Different Currency Transfer (e.g. USD to EUR)
        {
          "Date": today,
          "Account": "Checking (USD)",
          "Vendor": "Currency Exchange",
          "Category": "Transfer",
          "Amount": -100,
          "Remarks": "Exchange 100 USD to EUR",
          "Currency": "USD",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": transferId2
        },
        {
          "Date": today,
          "Account": "Wallet (EUR)",
          "Vendor": "Currency Exchange",
          "Category": "Transfer",
          "Amount": 92,
          "Remarks": "Received EUR from USD exchange",
          "Currency": "EUR",
          "Frequency": "",
          "End Date": "",
          "Transfer ID": transferId2
        }
      ];
      fileName = "transaction_template.csv";
      toast({
        title: "Template Downloaded",
        description: "A template with headers and example transfers has been generated.",
      });
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const headers = results.meta.fields || [];
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          toast({
            title: "Import Failed",
            description: `CSV is missing required headers: ${missingHeaders.join(", ")}.`,
            variant: "destructive",
          });
          return;
        }

        try {
          const transactionsToInsert = results.data.map((row: any) => ({
            user_id: session?.user?.id,
            date: row.Date,
            account: row.Account,
            vendor: row.Vendor,
            category: row.Category,
            amount: parseFloat(row.Amount),
            remarks: row.Remarks,
            currency: row.Currency,
            recurrence_frequency: row.Frequency || null,
            recurrence_end_date: row["End Date"] || null,
            transfer_id: row["Transfer ID"] || null,
          }));

          const { error } = await supabase
            .from("transactions")
            .insert(transactionsToInsert);

          if (error) throw error;

          toast({
            title: "Import Successful",
            description: `Successfully imported ${transactionsToInsert.length} transactions.`,
          });
          fetchTransactions();
        } catch (error: any) {
          toast({
            title: "Error importing transactions",
            description: error.message,
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        toast({
          title: "File reading error",
          description: error.message,
          variant: "destructive",
        });
      }
    });

    event.target.value = '';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage and track your financial activities.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <TransactionTable 
        transactions={transactions} 
        loading={loading} 
        onRefresh={fetchTransactions} 
      />

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchTransactions}
      />
    </div>
  );
};

export default Transactions;