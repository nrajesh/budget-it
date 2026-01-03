"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionDialog from "@/components/transactions/TransactionDialog";
import { useSession } from "@/hooks/useSession";

const Transactions = () => {
  const session = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    ];

    let dataToExport = transactions;
    let fileName = "transactions.csv";

    if (transactions.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      dataToExport = [
        {
          date: today,
          account: "Cash",
          currency: "USD",
          vendor: "Starbucks",
          amount: -5.5,
          remarks: "Morning coffee",
          category: "Food & Drink",
        },
        {
          date: today,
          account: "Bank Account",
          currency: "USD",
          vendor: "Employer Corp",
          amount: 3000.0,
          remarks: "Monthly Salary",
          category: "Income",
        },
      ];
      fileName = "transaction_template.csv";
      toast({
        title: "Template Downloaded",
        description: "No transactions found. A template file has been generated.",
      });
    }

    const csvRows = dataToExport.map((t) => [
      t.date,
      `"${t.account || ""}"`,
      t.currency,
      `"${t.vendor || ""}"`,
      t.amount,
      `"${t.remarks || ""}"`,
      `"${t.category || ""}"`,
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex gap-2">
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