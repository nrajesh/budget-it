import React from 'react';

interface ReportLayoutProps {
  children: React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ children }) => {
  return (
    <div className="report-layout">
      {children}
    </div>
  );
};

export default ReportLayout;