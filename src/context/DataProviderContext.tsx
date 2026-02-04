import { createContext, useContext, ReactNode, useState } from 'react';
import { DataProvider } from '@/types/dataProvider';
import { LocalDataProvider } from '@/providers/LocalDataProvider';

const DataProviderContext = createContext<DataProvider | null>(null);

export const DataProviderProvider = ({ children }: { children: ReactNode }) => {
  // Switched to LocalDataProvider
  const [dataProvider] = useState<DataProvider>(new LocalDataProvider());

  return (
    <DataProviderContext.Provider value={dataProvider}>
      {children}
    </DataProviderContext.Provider>
  );
};

export const useDataProvider = () => {
  const context = useContext(DataProviderContext);
  if (!context) {
    throw new Error("useDataProvider must be used within a DataProviderProvider");
  }
  return context;
};
