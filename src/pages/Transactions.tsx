"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionDialog from "@/components/transactions/TransactionDialog";
import { useSession } from "@/hooks/useSession";

const Transactions = () => {
  const session = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    const headers = [
      "Date",
      "Account",
      "Currency",
      "Vendor",
      "Amount",
      "Remarks",
      "Category",
      "Transfer ID"
    ];

    let dataToExport = transactions;
    let fileName = "transactions.csv";

    if (transactions.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      const transferId = "TRF-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      dataToExport = [
        {
          date: today,
          account: "Cash",
          currency: "USD",
          vendor: "Starbucks",
          amount: -5.5,
          remarks: "Morning coffee",
          category: "Food & Drink",
          transfer_id: ""
        },
        {
          date: today,
          account: "Main Bank",
          currency: "USD",
          vendor: "Employer Corp",
          amount: 3000.0,
          remarks: "Monthly Salary",
          category: "Income",
          transfer_id: ""
        },
        {
          date: today,
          account: "Main Bank",
          currency: "USD",
          vendor: "Internal Transfer",
          amount: -500.0,
          remarks: "Moving funds to Savings",
          category: "Transfer",
          transfer_id: transferId
        },
        {
          date: today,
          account: "Savings Account",
          currency: "USD",
          vendor: "Internal Transfer",
          amount: 500.0,
          remarks: "Moving funds from Main Bank",
          category: "Transfer",
          transfer_id: transferId
        }
      ];
      fileName = "transaction_template.csv";
      toast({
        title: "Template Downloaded",
        description: "No transactions found. A template file has been generated with examples.",
      });
    }

    const csvRows = dataToExport.map((t) => [
      t.date,
      `"${t.account || ""}"`,
      t.currency || "USD",
      `"${t.vendor || ""}"`,
      t.amount,
      `"${t.remarks || ""}"`,
      `"${t.category || ""}"`,
      `"${t.transfer_id || ""}"`
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (transactions.length > 0) {
      toast({
        title: "Export Successful",
        description: "Your transactions have been exported to CSV.",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic implementation of CSV import trigger
    toast({
      title: "Importing...",
      description: `Processing ${file.name}. Please wait.`,
    });

    // Reset input
    event.target.value = '';
    
    // In a real scenario, you'd parse the CSV here using a library like PapaParse
    // For now, we're just ensuring the UI and trigger are present.
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