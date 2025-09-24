import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface ExportButtonsProps {
  onPdfExport: () => void;
  onExcelExport: () => void;
  onCsvExport: () => void;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ onPdfExport, onExcelExport, onCsvExport }) => {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={onPdfExport}>
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