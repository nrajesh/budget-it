import * as React from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  LayoutGrid,
  BarChart3,
  Calendar,
  Newspaper,
  Building2,
  Globe,
  Home,
  Baby,
  Wallet,
  Landmark,
  Lightbulb,
  DatabaseZap,
  Shield,
  ChevronDown,
  Moon,
  Sun,
  Plus,
  Pin,
  PinOff,
  Heart,
  Receipt,
  CreditCard,
  FolderTree,
  Store,
  Coins,
  Clock,
  BookOpen,
  PiggyBank,
  Brain,
  HelpCircle,
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import AddEditTransactionDialog from "@/components/dialogs/AddEditTransactionDialog";
import { useLedger } from "@/contexts/LedgerContext";
import { useTour } from "@/contexts/TourContext";
import { useDefaultAccountSelection } from "@/hooks/useDefaultAccountSelection";
import { GlobalProgressDialog } from "@/components/dialogs/GlobalProgressDialog";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { LanguageIcon } from "@/components/language/LanguageIcon";
import { FeedbackLauncher } from "@/components/feedback/FeedbackLauncher";
import { GITHUB_REPO_URL } from "@/utils/feedbackLinks";

const PinTrigger = () => {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        toggleSidebar();
      }}
      className="hidden md:flex"
      aria-label={state === "collapsed" ? "Pin Sidebar" : "Unpin Sidebar"}
    >
      {state === "collapsed" ? (
        <Pin className="size-4" />
      ) : (
        <PinOff className="size-4" />
      )}
    </Button>
  );
};

/**
 * Auto-closes the mobile sidebar when the route changes.
 * Must be rendered inside SidebarProvider.
 */
const MobileSidebarCloser = () => {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  React.useEffect(() => {
    // Robust check for mobile view (768px is the MOBILE_BREAKPOINT in use-mobile.tsx)
    const isMobileViewport = window.innerWidth < 768;

    if (isMobileViewport) {
      // Use a small timeout to ensure navigation transition doesn't interfere with state update
      const timer = setTimeout(() => {
        setOpenMobile(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, setOpenMobile]);

  return null;
};

const Layout = () => {
  const { t } = useTranslation();
  const { setTheme, resolvedTheme } = useTheme();
  // const { user, userProfile, isLoadingUser } = useUser();
  const { activeLedger, ledgers, switchLedger, isLoading } = useLedger();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const { startTour, hasTourForCurrentRoute } = useTour();

  React.useEffect(() => {
    if (!isLoading && !activeLedger) {
      navigate("/ledgers");
    }
  }, [isLoading, activeLedger, navigate]);

  // Initialize default account selection globally
  useDefaultAccountSelection();

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith("/reports/essential")) {
      return t("layout.pageTitle.reportsEssential", {
        defaultValue: "Essential Reports",
      });
    }
    if (pathname.startsWith("/reports/advanced")) {
      return t("layout.pageTitle.reportsAdvanced", {
        defaultValue: "Advanced Reports",
      });
    }
    switch (pathname) {
      case "/":
        return t("layout.nav.dashboard", { defaultValue: "Dashboard" });
      case "/calendar":
        return "Calendar";
      case "/transactions":
        return "Transactions";
      case "/analytics":
        return "Analytics";
      case "/insights":
        return "Insights";
      case "/settings":
        return "Ledger";
      case "/language":
        return t("layout.pageTitle.language", { defaultValue: "Languages" });
      case "/data-management":
        return "Data";
      case "/vendors":
        return "Vendors";
      case "/currencies":
        return "Currencies";
      case "/accounts":
        return "Accounts";
      case "/categories":
        return "Categories";
      case "/scheduled":
        return "Scheduled Transactions";
      case "/budgets":
        return "Budgets";
      case "/ai-providers":
        return "AI Providers";
      case "/backup":
        return "Backup";
      case "/donate":
        return "Donate";
      default:
        return t("layout.pageTitle.notFound", {
          defaultValue: "Page Not Found",
        });
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  const displayName = activeLedger?.name || "Select Ledger";
  const displayEmail = activeLedger?.short_name || "Budget";
  // const displayAvatar = null; // Removed
  const avatarFallback = activeLedger?.icon ? (
    activeLedger.icon === "home" ? (
      <Home className="h-4 w-4" />
    ) : activeLedger.icon === "globe" ? (
      <Globe className="h-4 w-4" />
    ) : activeLedger.icon === "baby" ? (
      <Baby className="h-4 w-4" />
    ) : activeLedger.icon === "wallet" ? (
      <Wallet className="h-4 w-4" />
    ) : activeLedger.icon === "landmark" ? (
      <Landmark className="h-4 w-4" />
    ) : (
      <Building2 className="h-4 w-4" />
    )
  ) : (
    activeLedger?.name?.substring(0, 2).toUpperCase() || "LG"
  );

  return (
    <SidebarProvider className="min-h-screen">
      <MobileSidebarCloser />
      <Sidebar collapsible="icon" className="tour-sidebar-nav">
        <SidebarHeader className="pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <img
                src={
                  resolvedTheme === "dark"
                    ? "/logo-dark.png"
                    : "/logo-light.png"
                }
                alt="Vaulted Money"
                className={cn(
                  "size-8 shrink-0",
                  resolvedTheme !== "dark" && "mix-blend-multiply",
                )}
              />
              <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
                Vaulted Money
              </span>
            </div>
            <PinTrigger />
            <SidebarTrigger className="flex md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("layout.groups.dashboards", { defaultValue: "Dashboards" })}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <Link to="/">
                    <LayoutGrid />
                    <span>
                      {t("layout.nav.dashboard", { defaultValue: "Dashboard" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/calendar"}
                >
                  <Link to="/calendar">
                    <Calendar />
                    <span>
                      {t("layout.nav.calendar", { defaultValue: "Calendar" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/analytics"}
                >
                  <Link to="/analytics">
                    <BarChart3 />
                    <span>
                      {t("layout.nav.analytics", { defaultValue: "Analytics" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/insights"}
                >
                  <Link to="/insights">
                    <Lightbulb />
                    <span>
                      {t("layout.nav.insights", { defaultValue: "Insights" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/transactions"}
                >
                  <Link to="/transactions">
                    <Receipt />
                    <span>
                      {t("layout.nav.transactions", {
                        defaultValue: "Transactions",
                      })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("layout.groups.management", { defaultValue: "Management" })}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/accounts"}
                >
                  <Link to="/accounts">
                    <CreditCard />
                    <span>
                      {t("layout.nav.accounts", { defaultValue: "Accounts" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/categories"}
                >
                  <Link to="/categories">
                    <FolderTree />
                    <span>
                      {t("layout.nav.categories", {
                        defaultValue: "Categories",
                      })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/vendors"}
                >
                  <Link to="/vendors">
                    <Store />
                    <span>
                      {t("layout.nav.vendors", { defaultValue: "Vendors" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/currencies"}
                >
                  <Link to="/currencies">
                    <Coins />
                    <span>
                      {t("layout.nav.currencies", {
                        defaultValue: "Currencies",
                      })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/ai-providers"}
                >
                  <Link to="/ai-providers">
                    <Brain />
                    <span>
                      {t("layout.nav.aiProviders", {
                        defaultValue: "AI Providers",
                      })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("layout.groups.configure", { defaultValue: "Configure" })}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/scheduled"}
                >
                  <Link to="/scheduled">
                    <Clock />
                    <span>
                      {t("layout.nav.scheduled", { defaultValue: "Scheduled" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={location.pathname.startsWith("/reports")}
                    >
                      <Newspaper />
                      {t("layout.nav.reports", { defaultValue: "Reports" })}
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === "/reports/essential"}
                        >
                          <Link to="/reports/essential">
                            <span>
                              {t("layout.nav.reportsEssential", {
                                defaultValue: "Essential",
                              })}
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === "/reports/advanced"}
                        >
                          <Link to="/reports/advanced">
                            <span>
                              {t("layout.nav.reportsAdvanced", {
                                defaultValue: "Advanced",
                              })}
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/budgets"}
                >
                  <Link to="/budgets">
                    <PiggyBank />
                    <span>
                      {t("layout.nav.budgets", { defaultValue: "Budgets" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("layout.groups.setup", { defaultValue: "Setup" })}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/settings"}
                >
                  <Link to="/settings">
                    <BookOpen />
                    <span>
                      {t("layout.nav.ledger", { defaultValue: "Ledger" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/language"}
                >
                  <Link to="/language">
                    <LanguageIcon className="size-4" />
                    <span>
                      {t("layout.nav.languages", { defaultValue: "Languages" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/data-management"}
                >
                  <Link to="/data-management">
                    <DatabaseZap />
                    <span>
                      {t("layout.nav.data", { defaultValue: "Data" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/backup"}
                >
                  <Link to="/backup">
                    <Shield />
                    <span>
                      {t("layout.nav.backup", { defaultValue: "Backup" })}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/donate"}
                >
                  <Link to="/donate">
                    <Heart />
                    <span>
                      {t("layout.nav.donate", { defaultValue: "Donate" })}
                    </span>
                  </Link>
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                  {typeof avatarFallback === "string"
                    ? avatarFallback
                    : avatarFallback}
                </div>
                <div className="text-left flex-1 truncate group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {displayEmail}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 group-data-[collapsible=icon]:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                {t("layout.nav.myLedgers", { defaultValue: "My Ledgers" })}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {ledgers.map((l) => (
                  <DropdownMenuItem
                    key={l.id}
                    onClick={() => switchLedger(l.id)}
                  >
                    <span
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center",
                        activeLedger?.id === l.id ? "opacity-100" : "opacity-0",
                      )}
                    >
                      ✓
                    </span>
                    <span>{l.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link to="/settings">
                  {t("layout.nav.settings", { defaultValue: "Settings" })}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem("activeLedgerId");
                  localStorage.setItem("userLoggedOut", "true");
                  window.location.href = "/ledgers";
                }}
              >
                {t("layout.nav.logout", { defaultValue: "Log out" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background">
        <header className="flex h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="sm:hidden" />
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            {hasTourForCurrentRoute && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                onClick={startTour}
                aria-label={t("helpTour.start")}
              >
                <HelpCircle className="h-5 w-5 text-slate-600 dark:text-gray-300" />
                <span className="sr-only">{t("helpTour.start")}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              onClick={() =>
                setTheme(resolvedTheme === "light" ? "dark" : "light")
              }
              aria-label={t("layout.toggleTheme", {
                defaultValue: "Toggle theme",
              })}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
              <span className="sr-only">
                {t("layout.toggleTheme", { defaultValue: "Toggle theme" })}
              </span>
            </Button>
            <FeedbackLauncher triggerClassName="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700" />
          </div>
        </header>
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-background">
          <Outlet />
        </main>
        <footer
          className="shrink-0 border-t border-border/60 bg-background px-4 py-3 sm:px-6"
          role="contentinfo"
        >
          <p className="text-center text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            {t("layout.footer.tagline", {
              defaultValue: "Privacy-first | Data local | Open sourced",
            })}
          </p>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            aria-label={t("layout.footer.githubAria", {
              defaultValue: "Open Vaulted Money on GitHub",
            })}
          >
            {t("layout.footer.heartLink", {
              defaultValue: "Made with ❤️ for your financial freedom",
            })}
          </a>
        </footer>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              aria-label={t("layout.addTransaction", {
                defaultValue: "Add Transaction",
              })}
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">
                {t("layout.addTransaction", {
                  defaultValue: "Add Transaction",
                })}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {t("layout.addTransaction", { defaultValue: "Add Transaction" })}
          </TooltipContent>
        </Tooltip>
        <AddEditTransactionDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
        <GlobalProgressDialog />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
