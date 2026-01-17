import * as React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Users,
  Mountain,
  LayoutGrid,
  BarChart3,
  Phone,
  Newspaper,
  ChevronDown,
  FileText,
  Mail,
  Moon,
  Sun,
  Plus,
  User,
  Bell,
  Banknote,
  Tag,
  Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddTransactionDialog from "./AddTransactionDialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUser } from "@/contexts/UserContext";
import { useDefaultAccountSelection } from "@/hooks/useDefaultAccountSelection";

const Layout = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { user, userProfile, isLoadingUser } = useUser();
  const location = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Initialize default account selection globally
  useDefaultAccountSelection();

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith("/reports/essential")) return "Essential Reports";
    if (pathname.startsWith("/reports/advanced")) return "Advanced Reports";
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/transactions":
        return "Transactions";
      case "/analytics":
        return "Analytics";
      case "/settings":
        return "Settings";
      case "/profile":
        return "Profile Settings";
      case "/vendors":
        return "Vendors";
      case "/accounts":
        return "Accounts";
      case "/categories":
        return "Categories";
      case "/scheduled":
        return "Scheduled Transactions";
      case "/budgets":
        return "Budgets";
      default:
        return "Page Not Found";
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  const displayName = userProfile?.first_name && userProfile?.last_name
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : userProfile?.first_name || userProfile?.last_name || "User Name";
  const displayEmail = userProfile?.email || user?.email || "user@example.com";
  const displayAvatar = userProfile?.avatar_url || "/placeholder.svg";
  const avatarFallback = (userProfile?.first_name?.charAt(0) || "") + (userProfile?.last_name?.charAt(0) || "");

  return (
    <SidebarProvider
      className="min-h-screen"
    >
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-9 shrink-0">
              <Mountain className="size-5 text-primary" />
            </Button>
            <span className="text-lg font-semibold">Budget It!</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <SidebarGroup>
            <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <Link to="/">
                    <LayoutGrid />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/analytics"}>
                  <Link to="/analytics">
                    <BarChart3 />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/transactions"}>
                  <Link to="/transactions">
                    <Users />
                    <span>Transactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/accounts"}>
                  <Link to="/accounts">
                    <Banknote />
                    <span>Accounts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/categories"}>
                  <Link to="/categories">
                    <Tag />
                    <span>Categories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/vendors"}>
                  <Link to="/vendors">
                    <Phone />
                    <span>Vendors</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Setup</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/scheduled"}>
                  <Link to="/scheduled">
                    <Calendar />
                    <span>Scheduled</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={location.pathname.startsWith("/reports")}>
                      <Newspaper />
                      Reports
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/reports/essential"}>
                          <Link to="/reports/essential">
                            Essential
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/reports/advanced"}>
                          <Link to="/reports/advanced">
                            Advanced
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/budgets"}>
                  <Link to="/budgets">
                    <FileText />
                    <span>Budgets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarMenu>
              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={location.pathname.startsWith("/profile") || location.pathname.startsWith("/settings")}>
                      <User />
                      User Profile
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/profile"}>
                          <Link to="/profile">
                            Profile
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/settings"}>
                          <Link to="/settings">
                            Settings
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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
                disabled={isLoadingUser}
              >
                <Avatar className="size-8">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback>{avatarFallback || "JD"}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // No-op for local mode or reset state
                window.location.reload();
              }}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="sm:hidden" />
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Select value={selectedCurrency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
            >
              {resolvedTheme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
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
                    <AvatarImage src={displayAvatar} alt={displayName} />
                    <AvatarFallback>{avatarFallback || "JD"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  window.location.reload();
                }}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
          <Outlet />
        </main>
        <Button onClick={() => setIsAddDialogOpen(true)} className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Transaction</span>
        </Button>
        <AddTransactionDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;