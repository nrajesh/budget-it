import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export type Vendor = {
  id: string;
  name: string;
  created_at: string;
};

interface VendorsContextType {
  vendors: Vendor[];
  isLoading: boolean;
  addVendor: (name: string) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  deleteVendors: (vendorIds: string[]) => Promise<void>;
  exportVendorsToCsv: () => void;
  importVendorsFromCsv: (file: File) => Promise<void>;
}

const VendorsContext = React.createContext<VendorsContextType | undefined>(undefined);

export const VendorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchVendors = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      showError(`Failed to fetch vendors: ${error.message}`);
      setVendors([]);
    } else {
      setVendors(data as Vendor[]);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const addVendor = React.useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase.from('vendors').insert({ name }).select();
      if (error) {
        if (error.code === '23505') { // Unique violation error code
          throw new Error(`Vendor "${name}" already exists.`);
        }
        throw error;
      }
      showSuccess(`Vendor "${name}" added successfully!`);
      fetchVendors();
    } catch (error: any) {
      showError(`Failed to add vendor: ${error.message}`);
    }
  }, [fetchVendors]);

  const updateVendor = React.useCallback(async (vendor: Vendor) => {
    try {
      const { error } = await supabase.from('vendors').update({ name: vendor.name }).eq('id', vendor.id);
      if (error) {
        if (error.code === '23505') { // Unique violation error code
          throw new Error(`Vendor "${vendor.name}" already exists.`);
        }
        throw error;
      }
      showSuccess(`Vendor "${vendor.name}" updated successfully!`);
      fetchVendors();
    } catch (error: any) {
      showError(`Failed to update vendor: ${error.message}`);
    }
  }, [fetchVendors]);

  const deleteVendors = React.useCallback(async (vendorIds: string[]) => {
    try {
      const { error } = await supabase.from('vendors').delete().in('id', vendorIds);
      if (error) throw error;
      showSuccess(`${vendorIds.length} vendor(s) deleted successfully!`);
      fetchVendors();
    } catch (error: any) {
      showError(`Failed to delete vendor(s): ${error.message}`);
    }
  }, [fetchVendors]);

  const exportVendorsToCsv = React.useCallback(() => {
    if (vendors.length === 0) {
      showError("No vendors to export.");
      return;
    }

    const headers = ["id", "name", "created_at"];
    const csvRows = [
      headers.join(','),
      ...vendors.map(vendor => headers.map(header => {
        const value = (vendor as any)[header];
        return `"${String(value).replace(/"/g, '""')}"`; // Escape double quotes
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'vendors.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("Vendors exported to CSV!");
    } else {
      showError("Your browser does not support downloading files directly.");
    }
  }, [vendors]);

  const importVendorsFromCsv = React.useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error("CSV file is empty or malformed (missing headers or data).");
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const nameIndex = headers.indexOf('name');

      if (nameIndex === -1) {
        throw new Error("CSV must contain a 'name' column.");
      }

      const newVendorsToInsert: { name: string }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '')); // Split by comma, ignoring commas inside quotes
        if (values.length > nameIndex) {
          const name = values[nameIndex];
          if (name) {
            newVendorsToInsert.push({ name });
          }
        }
      }

      if (newVendorsToInsert.length === 0) {
        showError("No valid vendors found in the CSV file.");
        return;
      }

      // Filter out vendors that already exist by name to prevent unique constraint errors
      const existingVendorNames = new Set(vendors.map(v => v.name));
      const uniqueNewVendors = newVendorsToInsert.filter(
        nv => !existingVendorNames.has(nv.name)
      );

      if (uniqueNewVendors.length === 0) {
        showSuccess("All vendors from CSV already exist.");
        return;
      }

      const { error } = await supabase.from('vendors').insert(uniqueNewVendors);
      if (error) throw error;

      showSuccess(`${uniqueNewVendors.length} new vendor(s) imported successfully!`);
      fetchVendors();
    } catch (error: any) {
      showError(`Failed to import vendors: ${error.message}`);
    }
  }, [vendors, fetchVendors]);

  const value = React.useMemo(() => ({
    vendors,
    isLoading,
    addVendor,
    updateVendor,
    deleteVendors,
    exportVendorsToCsv,
    importVendorsFromCsv,
  }), [vendors, isLoading, addVendor, updateVendor, deleteVendors, exportVendorsToCsv, importVendorsFromCsv]);

  return (
    <VendorsContext.Provider value={value}>
      {children}
    </VendorsContext.Provider>
  );
};

export const useVendors = () => {
  const context = React.useContext(VendorsContext);
  if (context === undefined) {
    throw new Error('useVendors must be used within a VendorsProvider');
  }
  return context;
};