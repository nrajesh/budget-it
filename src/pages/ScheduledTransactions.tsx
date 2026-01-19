import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScheduledTransactionsTable } from "@/components/ScheduledTransactionsTable";
import { useTransactions } from "@/contexts/TransactionsContext";
import { AddEditScheduledTransactionDialog } from "@/components/scheduled-transactions/AddEditScheduledTransactionDialog";
import { ScheduledTransaction } from "@/types/dataProvider";
import { toast } from "sonner"; // Assuming sonner is used for toasts, or ui/use-toast

const ScheduledTransactionsPage = () => {
  const {
    scheduledTransactions,
    addScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
    accounts,
    vendors,
    categories,
    allSubCategories,

  } = useTransactions();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<ScheduledTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAdd = () => {
    setEditingTransaction(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (transaction: ScheduledTransaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduledTransaction(id);
      toast.success("Scheduled transaction deleted");
    } catch (error) {
      console.error("Failed to delete scheduled transaction:", error);
      toast.error("Failed to delete scheduled transaction");
    }
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const transactionData = {
        ...values,
        frequency: `${values.frequency_value}${values.frequency_unit}`
      };
      // Remove helper fields
      delete transactionData.frequency_value;
      delete transactionData.frequency_unit;

      // Currency is derived from account or default 'USD'
      const accountObj = accounts.find(a => a.name === values.account);
      const currency = accountObj?.currency || 'USD';

      const payload = { ...transactionData, currency };

      if (editingTransaction) {
        await updateScheduledTransaction({ ...editingTransaction, ...payload });
        toast.success("Scheduled transaction updated");
      } else {
        await addScheduledTransaction(payload);
        toast.success("Scheduled transaction created");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save scheduled transaction:", error);
      toast.error("Failed to save scheduled transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert ScheduledTransaction to display item format for table
  // The table expects ScheduledTransactionDisplayItem which is slightly different
  // Convert ScheduledTransaction to display item format for table
  const tableData = scheduledTransactions.map(t => ({
    ...t,
    // Ensure fields match
    sub_category: t.sub_category || undefined,
  }));

  return (
    <div className="space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            Scheduled Transactions
          </h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Manage your recurring income and expenses</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Scheduled
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <ScheduledTransactionsTable
          transactions={tableData}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <AddEditScheduledTransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={editingTransaction}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        accounts={accounts}
        allPayees={vendors.map(v => ({ value: v.name, label: v.name, isAccount: v.is_account }))}
        categories={categories}
        allSubCategories={allSubCategories}
        isLoading={false}
      />
    </div>
  );
};

export default ScheduledTransactionsPage;
