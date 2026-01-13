import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ScheduledTransactionsPage = () => {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Scheduled Transactions</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Scheduled transaction management is currently under construction for the offline-first version.
            Please check back in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduledTransactionsPage;
