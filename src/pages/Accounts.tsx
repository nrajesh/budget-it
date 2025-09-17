import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Payee } from '@/data/finance-data';
import AddEditPayeeDialog from '@/components/AddEditPayeeDialog';

const AccountsPage = () => {
  const { accounts, isLoadingAccounts } = useTransactions();
  const { formatCurrency } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedPayee, setSelectedPayee] = React.useState<Payee | null>(null);

  const handleEdit = (payee: Payee) => {
    setSelectedPayee(payee);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPayee(null);
    setIsDialogOpen(true);
  };

  if (isLoadingAccounts) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Starting Balance</TableHead>
                <TableHead className="text-right">Running Balance</TableHead>
                <TableHead className="text-center"># Transactions</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length > 0 ? (
                accounts.map(account => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.currency || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.starting_balance || 0, account.currency || 'USD')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.running_balance || 0, account.currency || 'USD')}</TableCell>
                    <TableCell className="text-center">{account.totalTransactions}</TableCell>
                    <TableCell>{account.remarks || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(account)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No accounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddEditPayeeDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        payee={selectedPayee}
        isAccount={true}
      />
    </div>
  );
};

export default AccountsPage;