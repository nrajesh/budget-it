import React from 'react';
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ThemedCard";
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { useCurrency } from "@/contexts/CurrencyContext";

interface SankeyChartProps {
  transactions: any[];
  accounts: any[];
}

const SankeyChart: React.FC<SankeyChartProps> = ({ transactions, accounts }) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const { sankeyData, chartHeight } = React.useMemo(() => {
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
    let hasTransfers = false;

    transactions.forEach(t => {
      if (t.category === 'Transfer') {
        hasTransfers = true;
      } else if (t.amount > 0) {
        incomeCategories.add(t.category);
      } else {
        expenseCategories.add(t.category);
      }
    });

    incomeCategories.forEach(name => addNode(`Income: ${name}`));
    accountNames.forEach(name => addNode(`Account: ${name}`));
    expenseCategories.forEach(name => addNode(`Expense: ${name}`));
    if (hasTransfers) {
      addNode('Transfer Out');
      addNode('Transfer In');
    }

    // Define links
    transactions.forEach(t => {
      const convertedAmount = Math.abs(convertBetweenCurrencies(t.amount, t.currency, selectedCurrency));

      if (t.category === 'Transfer') {
        if (t.amount < 0) { // Debit - money leaving an account
          const sourceNode = `Account: ${t.account}`;
          const targetNode = 'Transfer Out';
          if (nodeMap.has(sourceNode) && nodeMap.has(targetNode)) {
            links.push({
              source: nodeMap.get(sourceNode)!,
              target: nodeMap.get(targetNode)!,
              value: convertedAmount,
            });
          }
        } else { // Credit - money entering an account
          const sourceNode = 'Transfer In';
          const targetNode = `Account: ${t.account}`;
          if (nodeMap.has(sourceNode) && nodeMap.has(targetNode)) {
            links.push({
              source: nodeMap.get(sourceNode)!,
              target: nodeMap.get(targetNode)!,
              value: convertedAmount,
            });
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

    // Calculate dynamic height based on the number of nodes to prevent excessive white space
    const dynamicHeight = Math.max(150, nodes.length * 40);

    return {
      sankeyData: { nodes, links: filteredLinks },
      chartHeight: dynamicHeight
    };
  }, [transactions, accounts, selectedCurrency, convertBetweenCurrencies]);

  return (
    <ThemedCard className="col-span-1 md:col-span-2">
      <ThemedCardHeader>
        <ThemedCardTitle>Financial Flow (Sankey Chart)</ThemedCardTitle>
        <ThemedCardDescription>
          Visualizes the flow of money from income sources through accounts to expense categories.
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent>
        {sankeyData.nodes.length > 1 && sankeyData.links.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
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
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default SankeyChart;