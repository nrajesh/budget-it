import React from 'react';
import AccountImportForm from '@/components/AccountImportForm';

const ManageAccounts: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Accounts</h1>
      <p className="text-muted-foreground">
        View, edit, or import your financial accounts.
      </p>
      
      <div className="mt-8">
        <AccountImportForm />
      </div>
    </div>
  );
};

export default ManageAccounts;