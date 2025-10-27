"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>About This Application</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a personal finance management application built to help you track your income, expenses, and budgets.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;