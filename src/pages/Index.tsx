import * as React from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  DollarSign,
  FileText,
  LayoutGrid,
  Mail,
  MessageSquare,
  Moon,
  Mountain,
  Newspaper,
  Notebook,
  Phone,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import {
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const incomeVsExpensesData = [
  { month: "Aug", income: 4000, expenses: 2500 },
  { month: "Sep", income: 4200, expenses: 2800 },
  { month: "Oct", income: 4100, expenses: 2900 },
  { month: "Nov", income: 4500, expenses: 3000 },
  { month: "Dec", income: 4800, expenses: 3200 },
  { month: "Jan", income: 5000, expenses: 3400 },
  { month: "Feb", income: 5200, expenses: 3500 },
  { month: "Mar", income: 5100, expenses: 3600 },
  { month: "Apr", income: 5300, expenses: 3700 },
];

const spendingCategoriesData = [
  { name: "groceries", value: 45, fill: "var(--color-groceries)" },
  { name: "utilities", value: 20, fill: "var(--color-utilities)" },
  { name: "transport", value: 15, fill: "var(--color-transport)" },
  { name: "entertainment", value: 20, fill: "var(--color-entertainment)" },
];

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
  groceries: {
    label: "Groceries",
    color: "hsl(var(--chart-1))",
  },
  utilities: {
    label: "Utilities",
    color: "hsl(var(--chart-2))",
  },
  transport: {
    label: "Transport",
    color: "hsl(var(--chart-3))",
  },
  entertainment: {
    label: "Entertainment",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const Index = () => {
  const { setTheme, theme } = useTheme();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-9 shrink-0">
              <Mountain className="size-5 text-primary" />
            </Button>
            <span className="text-lg font-semibold">Budgeting</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <SidebarGroup>
            <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <LayoutGrid />
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BarChart3 />
                  Analytics
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Users />
                  Transactions
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Apps</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Phone />
                  Payees
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ShoppingCart />
                  Bills
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Newspaper />
                  Reports
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquare />
                  Alerts
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <User />
                      User Profile
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>Profile</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>Settings</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FileText />
                  Budgets
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Notebook />
                  Notes
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Mail />
                  Notifications
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-2 p-2"
              >
                <Avatar className="size-8">
                  <AvatarImage src="/placeholder.svg" alt="Jonathan Deo" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">Jonathan Deo</p>
                  <p className="text-xs text-muted-foreground">
                    j.deo@example.com
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="sm:hidden" />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Moon className="size-5" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="size-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-8 rounded-full">
                  <Avatar className="size-8">
                    <AvatarImage src="/placeholder.svg" alt="Jonathan Deo" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">
          <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle>Welcome Jonathan Deo</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Check your financial overview
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-4 sm:flex-row">
                <div className="grid flex-1 grid-cols-2 gap-4">
                  <div className="rounded-lg bg-primary/80 p-4">
                    <p className="text-sm text-primary-foreground/80">
                      Income
                    </p>
                    <p className="text-2xl font-bold">$5,400</p>
                  </div>
                  <div className="rounded-lg bg-primary/80 p-4">
                    <p className="text-sm text-primary-foreground/80">
                      Savings Rate
                    </p>
                    <p className="text-2xl font-bold">25%</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <img
                    src="/placeholder.svg"
                    alt="Welcome illustration"
                    className="h-32 w-32"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Spending
                  </CardTitle>
                  <DollarSign className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$1,890</div>
                  <p className="text-xs text-red-500">+10% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Bills Due
                  </CardTitle>
                  <FileText className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">
                    2 due this week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Worth
                  </CardTitle>
                  <DollarSign className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$120k</div>
                  <p className="text-xs text-green-500">+2% from last month</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <LineChart data={incomeVsExpensesData}>
                      <RechartsTooltip
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <XAxis dataKey="month" />
                      <YAxis
                        tickFormatter={(value) => `$${value / 1000}k`}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Spending Categories</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-48"
                  >
                    <RadialBarChart
                      data={spendingCategoriesData}
                      startAngle={90}
                      endAngle={-270}
                      innerRadius="70%"
                      outerRadius="100%"
                    >
                      <RechartsTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value) => `${value}%`}
                          />
                        }
                      />
                      <RadialBar dataKey="value" background />
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="grid w-full grid-cols-2 gap-2 text-sm">
                    {Object.entries(chartConfig)
                      .slice(2)
                      .map(([key, config]) => {
                        const item = spendingCategoriesData.find(
                          (d) => d.name === key,
                        );
                        if (!item) return null;
                        return (
                          <div key={config.label} className="flex items-center gap-2">
                            <div
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: config.color }}
                            />
                            <span>{config.label}</span>
                            <span className="ml-auto font-medium">
                              {item.value}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;