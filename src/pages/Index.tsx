import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Welcome to the Finance Tracker</h1>
      <p className="text-lg text-muted-foreground">
        Start managing your finances efficiently.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/manage-accounts">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Manage Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              Import or edit your financial accounts.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Index;