import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { useTransactions } from '@/contexts/TransactionsContext';

const SettingsPage: React.FC = () => {
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();

  // ... rest of the component implementation
};

export default SettingsPage;