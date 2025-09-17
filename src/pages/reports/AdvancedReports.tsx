import React from 'react';
import { DateRangePicker } from '@/components/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import TrendForecasting from '@/components/reports/TrendForecasting';
import AlertsAndInsights from '@/components/reports/AlertsAndInsights';
import { DateRange } from 'react-day-picker';
import { showSuccess } from '@/utils/toast';

const AdvancedReports = () => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const handlePdfExport = () => showSuccess("PDF export is not yet implemented.");
  const handleExcelExport = () => showSuccess("Excel export is not yet implemented.");
  const handleCsvExport = () => showSuccess("CSV export is not yet implemented.");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Reports</h2>
          <p className="text-muted-foreground">Future projections and intelligent insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <DateRangePicker dateRange={dateRange} onDateChange={setDateRange} />
          <ExportButtons 
            onPdfExport={handlePdfExport}
            onExcelExport={handleExcelExport}
            onCsvExport={handleCsvExport}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TrendForecasting />
        <AlertsAndInsights />
      </div>
    </div>
  );
};

export default AdvancedReports;