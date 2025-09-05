import * as React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AnalyticsPage = () => {
  return (
    <Layout pageTitle="Analytics">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A detailed analysis of your transactions will be displayed here soon.</p>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default AnalyticsPage;