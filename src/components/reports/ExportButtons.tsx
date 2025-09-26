declare const default_api: {
  Docling__create_new_docling_document: (args: { prompt: string }) => Promise<{ document_key: string }>;
  Docling__add_title_to_docling_document: (args: { document_key: string; title: string }) => Promise<any>;
  Docling__save_docling_document: (args: { document_key: string }) => Promise<any>;
};

import { Button } from "@/components/ui/button";
import { FileText, FileDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast"; // Assuming you have a useToast hook for notifications

interface ExportButtonsProps {
  onCsvExport: () => void;
  reportContent: string; // The content of the report to be converted
  reportTitle: string; // The title of the report
  isLoading: boolean; // For the overall report loading
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ onCsvExport, reportContent, reportTitle, isLoading }) => {
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const { toast } = useToast();

  const handlePdfExport = async () => {
    setIsPdfExporting(true);
    try {
      // 1. Create a new Docling document from the report content
      // The prompt argument should be a string containing the content of the page.
      // For a real report, this 'reportContent' prop would contain the formatted text.
      const createResult = await default_api.Docling__create_new_docling_document({
        prompt: reportContent
      });
      const documentKey = createResult.document_key;

      // 2. Add a title to the Docling document
      await default_api.Docling__add_title_to_docling_document({
        document_key: documentKey,
        title: reportTitle
      });

      // 3. Save the Docling document (this saves to markdown and JSON on disk)
      await default_api.Docling__save_docling_document({
        document_key: documentKey
      });

      toast({
        title: "PDF Export Initiated",
        description: "The report has been converted to a Docling document and saved. A PDF download would typically follow here, but direct PDF generation for download is not supported by the current Docling tools.",
      });

    } catch (error: any) {
      console.error("Error during PDF export:", error);
      toast({
        title: "PDF Export Failed",
        description: `There was an error converting or saving the document: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsPdfExporting(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={handlePdfExport} disabled={isLoading || isPdfExporting}>
        <FileText className="mr-2 h-4 w-4" />
        {isPdfExporting ? "Exporting..." : "PDF"}
      </Button>
      <Button variant="outline" onClick={onCsvExport} disabled={isLoading}>
        <FileDown className="mr-2 h-4 w-4" />
        CSV
      </Button>
    </div>
  );
};

export default ExportButtons;