import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { useCurrency } from "@/contexts/CurrencyContext";

interface SankeyChartProps {
  transactions: any[];
  accounts: any[];
}

const SankeyChart: React.FC<SankeyChartProps> = ({ transactions, accounts }) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const sankeyData = React.useMemo(() => {
    const nodes: { name: string }[] = [];
    const links: { source: number; target: number; value: number }[] = [];
    const nodeMap = new Map<string, number>();

    const addNode = (name: string) => {
      if (!nodeMap.has(name)) {
        nodeMap.set(name, nodes.length);
        nodes.push({ name });
      }
    };

    // Define nodes
    const incomeCategories = new Set<string>();
    const expenseCategories = new Set<string>();
    const accountNames = new Set(accounts.map(a => a.name));

    transactions.forEach(t => {
      if (t.category !== 'Transfer') {
        if (t.amount > 0) {
          incomeCategories.add(t.category);
        } else {
          expenseCategories.add(t.category);
        }
      }
    });

    incomeCategories.forEach(name => addNode(`Income: ${name}`));
    accountNames.forEach(name => addNode(`Account: ${name}`));
    expenseCategories.forEach(name => addNode(`Expense: ${name}`));

    // Define links, preventing cycles
    const processedTransferIds = new Set<string>();

    transactions.forEach(t => {
      const convertedAmount = Math.abs(convertBetweenCurrencies(t.amount, t.currency, selectedCurrency));

      if (t.category === 'Transfer') {
        // Process only the debit side of a transfer to create a single directional link
        // and prevent cycles. Also, ensure we haven't processed this transfer_id yet.
        if (t.transfer_id && !processedTransferIds.has(t.transfer_id) && t.amount < 0) {
          const sourceNode = `Account: ${t.account}`;
          const targetNode = `Account: ${t.vendor}`;
          
          // Ensure source and target are different to prevent self-loops
          if (nodeMap.has(sourceNode) && nodeMap.has(targetNode) && sourceNode !== targetNode) {
            links.push({
              source: nodeMap.get(sourceNode)!,
              target: nodeMap.get(targetNode)!,
              value: convertedAmount,
            });
            processedTransferIds.add(t.transfer_id);
          }
        }
      } else if (t.amount > 0) {
        // Income flow
        const sourceNode = `Income: ${t.category}`;
        const targetNode = `Account: ${t.account}`;
        if (nodeMap.has(sourceNode) && nodeMap.has(targetNode)) {
          links.push({
            source: nodeMap.get(sourceNode)!,
            target: nodeMap.get(targetNode)!,
            value: convertedAmount,
          });
        }
      } else {
        // Expense flow
        const sourceNode = `Account: ${t.account}`;
        const targetNode = `Expense: ${t.category}`;
        if (nodeMap.has(sourceNode) && nodeMap.has(targetNode)) {
          links.push({
            source: nodeMap.get(sourceNode)!,
            target: nodeMap.get(targetNode)!,
            value: convertedAmount,
          });
        }
      }
    });

    // Filter out links with zero value
    const filteredLinks = links.filter(link => link.value > 0);

    return { nodes, links: filteredLinks };
  }, [transactions, accounts, selectedCurrency, convertBetweenCurrencies]);

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Financial Flow (Sankey Chart)</CardTitle>
        <CardDescription>
          Visualizes the flow of money from income sources through accounts to expense categories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sankeyData.nodes.length > 1 && sankeyData.links.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <Sankey
              data={sankeyData}
              nodePadding={50}
              margin={{
                left: 100,
                right: 100,
                top: 5,
                bottom: 5,
              }}
              link={{ stroke: '#777' }}
            >
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </Sankey>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-center">
            <p className="text-muted-foreground">
              Not enough data to display the Sankey chart. Please add more transactions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SankeyChart;