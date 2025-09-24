import React from 'react';
import ExportButtons from '@/components/reports/ExportButtons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ReportLayoutProps {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({
  title,
  description,
  children,
}) => {
  const handleExcelExport = () => {
    // In a real app, this would trigger a download.
    alert('Exporting to Excel...');
  };

  const handleCsvExport = () => {
    // In a real app, this would trigger a download.
    alert('Exporting to CSV...');
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <ExportButtons
            onExcelExport={handleExcelExport}
            onCsvExport={handleCsvExport}
          />
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
};

export default ReportLayout;