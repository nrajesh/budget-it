import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import ExportButtons from '@/components/reports/ExportButtons';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { useTransactionData } from '@/hooks/transactions/useTransactionData';
import { useTransactions } from '@/contexts/TransactionsContext';
import { showSuccess, showError } from '@/utils/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas'; // Import html2canvas

interface ReportLayoutProps {
  title: string;
  description: React.ReactNode;
  children: (props: {
    historicalFilteredTransactions: any[];
    combinedFilteredTransactions: any[];
    futureFilteredTransactions: any[];
    accounts: any[];
  }) => React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ title, description, children }) => {
  const { accounts } = useTransactions();
  const filterProps = useTransactionFilters();
  const dataProps = useTransactionData(filterProps);

  const { historicalFilteredTransactions, futureFilteredTransactions } = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const historical = dataProps.filteredTransactions.filter(t => new Date(t.date) <= today);
    const future = dataProps.filteredTransactions.filter(t => new Date(t.date) > today && t.is_scheduled_origin);
    return { historicalFilteredTransactions: historical, futureFilteredTransactions: future };
  }, [dataProps.filteredTransactions]);

  const handlePdfExport = async () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;

      doc.setFontSize(18);
      doc.text(title, margin, yPos);
      yPos += 15;

      const reportContent = document.getElementById('report-content');
      if (!reportContent) {
        showError("Could not find report content to export.");
        return;
      }

      // Add description
      const descriptionElement = reportContent.querySelector('.text-muted-foreground');
      if (descriptionElement) {
        const descriptionText = descriptionElement.textContent || '';
        const splitDescription = doc.splitTextToSize(descriptionText, doc.internal.pageSize.width - 2 * margin);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(splitDescription, margin, yPos);
        yPos += (splitDescription.length * 5) + 10; // Estimate height for description
        doc.setTextColor(0);
      }

      // Select all cards within the report content
      const cards = Array.from(reportContent.querySelectorAll('.grid > .flex.flex-col.h-full, .grid > .col-span-1, .grid > .col-span-2, .grid > .md\\:col-span-2'));

      for (const card of cards) {
        if (!card) continue;

        const cardTitleElement = card.querySelector('.text-lg.font-semibold, .text-xl.font-bold, .text-2xl.font-bold');
        const cardTitle = cardTitleElement ? cardTitleElement.textContent?.trim() : 'Report Section';

        const tableElement = card.querySelector('table');

        if (tableElement) {
          // Handle tables
          if (yPos + 50 > pageHeight - margin) { // Estimate space needed for table title + some rows
            doc.addPage();
            yPos = margin;
          }

          doc.setFontSize(14);
          doc.text(cardTitle, margin, yPos);
          yPos += 10;

          autoTable(doc, {
            html: tableElement,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: '#16a34a' }, // green-600
            didParseCell: (data) => {
              if (data.cell.raw instanceof HTMLElement) {
                const style = window.getComputedStyle(data.cell.raw);
                if (style.color === 'rgb(34, 197, 94)') { // Tailwind green-500
                  data.cell.styles.textColor = '#22c55e';
                } else if (style.color === 'rgb(239, 68, 68)') { // Tailwind red-500
                  data.cell.styles.textColor = '#ef4444';
                }
              }
            },
          });
          yPos = (doc as any).lastAutoTable.finalY + 15;
        } else {
          // Handle charts and any other cards (like summary cards with icons) as images
          if (yPos + 100 > pageHeight - margin) { // Estimate space needed for card title + image
            doc.addPage();
            yPos = margin;
          }

          doc.setFontSize(14);
          doc.text(cardTitle, margin, yPos);
          yPos += 10;

          // Capture the entire card as an image
          const canvas = await html2canvas(card as HTMLElement, { scale: 2 }); // Capture the whole card
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 180; // mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPos + imgHeight > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 15;
        }
      }

      doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
      showSuccess("PDF export started. Your download will begin shortly.");
    } catch (error: any) {
      console.error("PDF Export failed:", error);
      showError(`PDF Export failed: ${error.message}`);
    }
  };

  const handleExcelExport = () => showError("Excel export is not yet implemented.");
  const handleCsvExport = () => showError("CSV export is not yet implemented.");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <div className="text-muted-foreground">{description}</div>
        </div>
        <ExportButtons
          onPdfExport={handlePdfExport}
          onExcelExport={handleExcelExport}
          onCsvExport={handleCsvExport}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <TransactionFilters
            {...filterProps}
            onDateChange={filterProps.setDateRange}
            onResetFilters={filterProps.handleResetFilters}
          />
        </CardHeader>
      </Card>

      <div className="space-y-4" id="report-content">
        {children({
          historicalFilteredTransactions,
          combinedFilteredTransactions: dataProps.filteredTransactions,
          futureFilteredTransactions,
          accounts,
        })}
      </div>
    </div>
  );
};

export default ReportLayout;