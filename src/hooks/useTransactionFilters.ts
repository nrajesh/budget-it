import { useState } from 'react';

export const useTransactionFilters = () => {
  const [filters, setFilters] = useState({
    // filter state
  });

  // ... rest of the hook implementation

  return {
    filters,
    setFilters,
    // ... other filter functions
  };
};