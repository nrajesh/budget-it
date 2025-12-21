import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccountImport } from '@/hooks/useAccountImport';
import { Loader2, Upload } from 'lucide-react';

const AccountImportForm: React.FC = () => {
  const { importAccounts, isLoading, error } = useAccountImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importAccounts(file);
    }
    // Reset file input to allow re-uploading the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Import Accounts via CSV</CardTitle>
        <CardDescription>
          Upload a CSV file containing account details. Required columns: 
          <code className="bg-gray-100 p-1 rounded text-sm">name</code>, 
          <code className="bg-gray-100 p-1 rounded text-sm">currency</code>, 
          <code className="bg-gray-100 p-1 rounded text-sm">starting_balance</code>, 
          <code className="bg-gray-100 p-1 rounded text-sm">remarks</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            disabled={isLoading}
          />
          <Button 
            onClick={handleButtonClick} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select CSV File
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-red-500 mt-2 p-2 border border-red-200 bg-red-50 rounded">
              Error: {error}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountImportForm;