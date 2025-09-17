import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

const TrendForecasting = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Forecasting</CardTitle>
        <CardDescription>
          Provides projections based on current habits and goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-64 text-center">
        <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Coming Soon!</h3>
        <p className="text-muted-foreground">
          This advanced feature will help you plan your financial future.
        </p>
      </CardContent>
    </Card>
  );
};

export default TrendForecasting;