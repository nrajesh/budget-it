import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { useTransactions } from '@/contexts/TransactionsContext';

const SettingsPage: React.FC = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();

  return <div>Settings Page Content</div>;
};

export default SettingsPage;