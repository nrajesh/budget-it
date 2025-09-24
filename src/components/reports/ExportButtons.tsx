import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, FileJson } from 'lucide-react';

interface ExportButtonsProps {
  onExcelExport: () => void;
  onCsvExport: () => void;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ onExcelExport, onCsvExport }) => {
  const handlePdfExport = () => {
    window.print();
  };

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={handlePdfExport}>
        <FileText className="mr-2 h-4 w-4" />
        PDF
      </Button>
      <Button variant="outline" onClick={onExcelExport}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Excel
      </Button>
      <Button variant="outline" onClick={onCsvExport}>
        <FileJson className="mr-2 h-4 w-4" />
        CSV
      </Button>
    </div>
  );
};

export default ExportButtons;