import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { type ChartConfig } from "@/components/ui/chart";

interface AccountFilterProps {
  allAccounts: string[];
  selectedAccounts: string[];
  onAccountToggle: (accountSlug: string) => void;
  chartConfig: ChartConfig;
}

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-');

export function AccountFilter({ allAccounts, selectedAccounts, onAccountToggle, chartConfig }: AccountFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter by Account</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-x-6 gap-y-2">
        {allAccounts.map(account => {
          const slug = slugify(account);
          return (
            <div key={slug} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-${slug}`}
                checked={selectedAccounts.includes(slug)}
                onCheckedChange={() => onAccountToggle(slug)}
              />
              <Label htmlFor={`filter-${slug}`} className="text-sm font-medium leading-none flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartConfig[slug]?.color }} />
                {account}
              </Label>
            </div>
          )
        })}
      </CardContent>
    </Card>
  );
}