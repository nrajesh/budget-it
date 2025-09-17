import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const AlertsAndInsights = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts and Insights</CardTitle>
        <CardDescription>
          Highlights anomalies, overspending, and provides tailored financial tips.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Coming Soon!</h3>
        <p className="text-muted-foreground">
          Get automated insights and alerts to stay on top of your finances.
        </p>
      </CardContent>
    </Card>
  );
};

export default AlertsAndInsights;