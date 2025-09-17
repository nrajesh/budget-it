import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/contexts/UserContext';
// ... other imports

const CategoriesPage = () => {
  const { categories, isLoadingCategories, refetchCategories } = useTransactions();
  const { user } = useUser();
  // ... other logic

  return (
    <div className="space-y-4">
      {/* ... page content */}
    </div>
  );
};

export default CategoriesPage;