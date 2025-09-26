import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Transaction } from "@/data/finance-data";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/DatePickerWithRange";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import ExportButtons from "@/components/reports/ExportButtons";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/contexts/UserContext";

// Define a type for the report data rows
interface ReportRow {
  id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  currency: string;
  remarks?: string;
}

const AdvancedReports = () => {
  const { transactions, isLoadingTransactions, refetchTransactions, accounts, vendors, categories } = useTransactions();
  const { selectedCurrency, formatCurrency, convertBetweenCurrencies, isLoadingCurrencies } = useCurrency();
  const { userProfile } = useUser();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [selectedAccount, setSelectedAccount] = React.useState<string>("All");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [selectedVendor, setSelectedVendor] = React.useState<string>("All");

  const isLoading = isLoadingTransactions || isLoadingCurrencies;

  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

    if (dateRange?.from) {
      const fromDate = dateRange.from;
      const toDate = dateRange.to || new Date();
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });
    }

    if (selectedAccount !== "All") {
      filtered = filtered.filter(t => t.account === selectedAccount);
    }
    if (selectedCategory !== "All") {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    if (selectedVendor !== "All") {
      filtered = filtered.filter(t => t.vendor === selectedVendor);
    }

    return filtered.map(t => {
      const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
      return {
        ...t,
        amount: convertedAmount,
        currency: selectedCurrency,
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateRange, selectedAccount, selectedCategory, selectedVendor, selectedCurrency, convertBetweenCurrencies]);

  const totalIncome = React.useMemo(() => {
    return filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = React.useMemo(() => {
    return filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const netBalance = totalIncome + totalExpenses;

  const columns: ColumnDef<ReportRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => format(new Date(row.original.date), "PPP"),
    },
    {
      accessorKey: "account",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Account" />
      ),
    },
    {
      accessorKey: "vendor",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = formatCurrency(amount, row.original.currency);
        return <div className={`font-medium ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatted}</div>;
      },
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Remarks" />
      ),
      cell: ({ row }) => row.original.remarks || "-",
    },
  ];

  // Generate report content for Docling
  const reportContent = React.useMemo(() => {
    let content = `# Advanced Financial Report\n\n`;
    content += `**Date Range:** ${dateRange?.from ? format(dateRange.from, "PPP") : "N/A"} - ${dateRange?.to ? format(dateRange.to, "PPP") : "N/A"}\n`;
    content += `**Default Currency:** ${selectedCurrency}\n\n`;
    content += `**Summary:**\n`;
    content += `- Total Income: ${formatCurrency(totalIncome)}\n`;
    content += `- Total Expenses: ${formatCurrency(totalExpenses)}\n`;
    content += `- Net Balance: ${formatCurrency(netBalance)}\n\n`;

    content += `## Transactions\n\n`;
    if (filteredTransactions.length === 0) {
      content += "No transactions found for the selected criteria.\n";
    } else {
      content += "| Date | Account | Vendor | Category | Amount | Remarks |\n";
      content += "|---|---|---|---|---|---|\n";
      filteredTransactions.forEach(t => {
        content += `| ${format(new Date(t.date), "yyyy-MM-dd")} | ${t.account} | ${t.vendor} | ${t.category} | ${formatCurrency(t.amount, t.currency)} | ${t.remarks || '-'} |\n`;
      });
    }
    return content;
  }, [filteredTransactions, dateRange, selectedCurrency, totalIncome, totalExpenses, netBalance, formatCurrency]);

  const reportTitle = `Advanced_Report_${format(new Date(), "yyyyMMdd_HHmmss")}`;

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Advanced Reports</h2>
          <div className="flex items-center space-x-2">
            <ExportButtons
              onCsvExport={() => { /* CSV export logic here */ }}
              reportContent={reportContent}
              reportTitle={reportTitle}
              isLoading={isLoading}
            />
            <Button variant="outline" size="icon" onClick={() => refetchTransactions()} disabled={isLoading}>
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Accounts</SelectItem>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.name}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger>
                <SelectValue placeholder="Select Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Vendors</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.name}>{vendor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netBalance)}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns} data={filteredTransactions} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

export default AdvancedReports;