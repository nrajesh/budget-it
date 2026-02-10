import * as React from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  Building2,
  Globe,
  Home,
  Baby,
  Wallet,
  Landmark,
  Lightbulb,
  DatabaseZap
} from "lucide-react";
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
  DropdownMenuGroup,
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

import AddEditTransactionDialog from "@/components/dialogs/AddEditTransactionDialog";
// import { useUser } from "@/contexts/UserContext";
import { useLedger } from "@/contexts/LedgerContext";
import { useDefaultAccountSelection } from "@/hooks/useDefaultAccountSelection";
import { GlobalProgressDialog } from "@/components/dialogs/GlobalProgressDialog";

const Layout = () => {
  const { setTheme, resolvedTheme } = useTheme();
  // const { user, userProfile, isLoadingUser } = useUser();
  const { activeLedger, ledgers, switchLedger, isLoading } = useLedger();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !activeLedger) {
      navigate('/ledgers');
    }
  }, [isLoading, activeLedger, navigate]);

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
      case "/insights":
        return "Insights";
      case "/settings":
        return "Settings";
      case "/data-management":
        return "Data Management";
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

  const displayName = activeLedger?.name || "Select Ledger";
  const displayEmail = activeLedger?.short_name || "Budget";
  // const displayAvatar = null; // Removed
  const avatarFallback = activeLedger?.icon ? (
    activeLedger.icon === 'home' ? <Home className="h-4 w-4" /> :
      activeLedger.icon === 'globe' ? <Globe className="h-4 w-4" /> :
        activeLedger.icon === 'baby' ? <Baby className="h-4 w-4" /> :
          activeLedger.icon === 'wallet' ? <Wallet className="h-4 w-4" /> :
            activeLedger.icon === 'landmark' ? <Landmark className="h-4 w-4" /> :
              <Building2 className="h-4 w-4" />
  ) : (activeLedger?.name?.substring(0, 2).toUpperCase() || "LG");

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
                <SidebarMenuButton asChild isActive={location.pathname === "/insights"}>
                  <Link to="/insights">
                    <Lightbulb />
                    <span>Insights</span>
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/settings"}>
                  <Link to="/settings">
                    <User />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/data-management"}>
                  <Link to="/data-management">
                    <DatabaseZap />
                    <span>Data Management</span>
                  </Link>
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {typeof avatarFallback === 'string' ? avatarFallback : avatarFallback}
                </div>
                <div className="text-left flex-1 truncate">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {displayEmail}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>My Ledgers</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {ledgers.map(l => (
                  <DropdownMenuItem key={l.id} onClick={() => switchLedger(l.id)}>
                    <span className={cn("mr-2 flex h-4 w-4 items-center justify-center", activeLedger?.id === l.id ? "opacity-100" : "opacity-0")}>
                      ✓
                    </span>
                    <span>{l.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                localStorage.removeItem('activeLedgerId');
                localStorage.setItem('userLoggedOut', 'true');
                window.location.href = '/ledgers';
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-border">
                    {typeof avatarFallback === 'string' ? avatarFallback : avatarFallback}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Ledgers</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ledgers.map(l => (
                  <DropdownMenuItem key={l.id} onClick={() => switchLedger(l.id)}>
                    <span className={cn("mr-2 flex h-4 w-4 items-center justify-center", activeLedger?.id === l.id ? "opacity-100" : "opacity-0")}>
                      ✓
                    </span>
                    <span>{l.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  localStorage.removeItem('activeLedgerId');
                  localStorage.setItem('userLoggedOut', 'true');
                  window.location.href = '/ledgers';
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
        <Button onClick={() => setIsAddDialogOpen(true)} className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Transaction</span>
        </Button>
        <AddEditTransactionDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
        <GlobalProgressDialog />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;