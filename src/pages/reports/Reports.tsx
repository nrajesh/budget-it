"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Reports = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Select a report to view your financial insights.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Link to="/reports/essential">
            <Button className="w-full">Essential Reports</Button>
          </Link>
          <Link to="/reports/advanced">
            <Button className="w-full">Advanced Reports</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;