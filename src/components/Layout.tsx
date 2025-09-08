import * as React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Home,
  ArrowRightLeft,
  BarChart2,
  Settings,
  Users,
  Mountain,
  LayoutGrid,
  BarChart3,
  Phone,
  ShoppingCart,
  Newspaper,
  MessageSquare,
  ChevronDown,
  FileText,
  Notebook,
  Mail,
  Moon,
  Plus,
  User,
  Bell,
  Banknote,
} from "lucide-react";
import { useTransactions } from "@/contexts/TransactionsContext";
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
import { useUser } from "@/contexts/UserContext"; // Import useUser
import { supabase } from "@/integrations/supabase/client"; // Import supabase for logout

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/payees", label: "Payees", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const Layout = () => {
  const { setTheme, theme } = useTheme();
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { user, userProfile, isLoadingUser } = useUser(); // Use user context
  const location = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const getPageTitle = (pathname: string) => {
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
    <SidebarProvider className="min-h-screen">
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
                <Link to="/" className="w-full">
                  <SidebarMenuButton isActive={location.pathname === "/"}>
                    <LayoutGrid />
                    Dashboard
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/analytics" className="w-full">
                  <SidebarMenuButton isActive={location.pathname === "/analytics"}>
                    <BarChart3 />
                    Analytics
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/transactions" className="w-full">
                  <SidebarMenuButton isActive={location.pathname === "/transactions"}>
                    <Users />
                    Transactions
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Apps</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link to="/vendors" className="w-full">
                  <SidebarMenuButton isActive={location.pathname === "/vendors"}>
                    <Phone />
                    Vendors
                  </SidebarMenuButton>
                </Link>
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
                    <SidebarMenuButton isActive={location.pathname.startsWith("/profile") || location.pathname.startsWith("/settings")}>
                      <User />
                      User Profile
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Link to="/profile" className="w-full">
                          <SidebarMenuSubButton isActive={location.pathname === "/profile"}>
                            Profile
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link to="/settings" className="w-full">
                          <SidebarMenuSubButton isActive={location.pathname === "/settings"}>
                            Settings
                          </SidebarMenuSubButton>
                        </Link>
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
                <Link to="/accounts" className="w-full">
                  <SidebarMenuButton isActive={location.pathname === "/accounts"}>
                    <Banknote />
                    Accounts
                  </SidebarMenuButton>
                </Link>
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
              <DropdownMenuItem onClick={async () => {
                await supabase.auth.signOut();
                // Optionally redirect to login page
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
            {/* Currency Dropdown */}
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
                <DropdownMenuItem onClick={async () => {
                  await supabase.auth.signOut();
                  // Optionally redirect to login page
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