import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { type ChartConfig } from "@/components/ui/chart";
import { slugify } from "@/lib/utils";

interface AccountFilterProps {
  allAccounts: string[];
  selectedAccounts: string[];
  onAccountToggle: (accountSlug: string) => void;
  chartConfig: ChartConfig;
}

export function AccountFilter({ allAccounts, selectedAccounts, onAccountToggle, chartConfig }: AccountFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter by Account</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        {allAccounts.map(account => {
          const accountSlug = slugify(account);
          const id = `account-${accountSlug}`;
          return (
            <div key={id} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={selectedAccounts.includes(accountSlug)}
                onCheckedChange={() => onAccountToggle(accountSlug)}
                style={{ backgroundColor: selectedAccounts.includes(accountSlug) ? chartConfig[accountSlug]?.color : undefined }}
              />
              <Label htmlFor={id} className="cursor-pointer">{account}</Label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}