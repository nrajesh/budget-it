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

const salesProfitData = [
  { month: "Aug", profit: 30000, expenses: 20000 },
  { month: "Sep", profit: 28000, expenses: 22000 },
  { month: "Oct", profit: 25000, expenses: 28000 },
  { month: "Nov", profit: 28000, expenses: 30000 },
  { month: "Dec", profit: 45000, expenses: 35000 },
  { month: "Jan", profit: 60000, expenses: 40000 },
  { month: "Feb", profit: 75000, expenses: 50000 },
  { month: "Mar", profit: 65000, expenses: 55000 },
  { month: "Apr", profit: 50000, expenses: 60000 },
];

const productSalesData = [
  { name: "modernize", value: 36, fill: "var(--color-modernize)" },
  { name: "spike", value: 17, fill: "var(--color-spike)" },
  { name: "ample", value: 22, fill: "var(--color-ample)" },
  { name: "materialm", value: 31, fill: "var(--color-materialm)" },
];

const chartConfig = {
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
  modernize: {
    label: "Modernize",
    color: "hsl(var(--chart-1))",
  },
  spike: {
    label: "Spike",
    color: "hsl(var(--chart-2))",
  },
  ample: {
    label: "Ample",
    color: "hsl(var(--chart-3))",
  },
  materialm: {
    label: "MaterialM",
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
            <span className="text-lg font-semibold">Finance</span>
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
                  CRM
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
                  Contacts
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ShoppingCart />
                  Ecommerce
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Newspaper />
                  Blogs
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquare />
                  Chats
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
                  Invoice
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
                  Email
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
                  Check all the statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-4 sm:flex-row">
                <div className="grid flex-1 grid-cols-2 gap-4">
                  <div className="rounded-lg bg-primary/80 p-4">
                    <p className="text-sm text-primary-foreground/80">
                      New Leads
                    </p>
                    <p className="text-2xl font-bold">573</p>
                  </div>
                  <div className="rounded-lg bg-primary/80 p-4">
                    <p className="text-sm text-primary-foreground/80">
                      Conversion
                    </p>
                    <p className="text-2xl font-bold">87%</p>
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
                  <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,358</div>
                  <p className="text-xs text-green-500">+23% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Refunds
                  </CardTitle>
                  <TrendingDown className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">434</div>
                  <p className="text-xs text-red-500">-12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Earnings
                  </CardTitle>
                  <DollarSign className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$245k</div>
                  <p className="text-xs text-green-500">+8% from last month</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Sales Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <LineChart data={salesProfitData}>
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
                        dataKey="profit"
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
                  <CardTitle>Product Sales</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-48"
                  >
                    <RadialBarChart
                      data={productSalesData}
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
                        const item = productSalesData.find(
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