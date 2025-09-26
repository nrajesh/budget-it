import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Users,
  LineChart,
  Settings,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  BarChart3,
  CalendarClock,
  Wallet,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showSuccess } from "@/utils/toast";
import { ModeToggle } from "./ModeToggle";

const mainNavItems = [
  { to: "/", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
  { to: "/transactions", icon: <Wallet className="h-4 w-4" />, label: "Transactions" },
  { to: "/scheduled", icon: <CalendarClock className="h-4 w-4" />, label: "Scheduled" },
  { to: "/payees", icon: <Users className="h-4 w-4" />, label: "Payees" },
  { to: "/categories", icon: <BarChart3 className="h-4 w-4" />, label: "Categories" },
  { to: "/reports", icon: <LineChart className="h-4 w-4" />, label: "Reports" },
  { to: "/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
];

const reportNavItems = [
  { to: "/reports/essentials", title: "Essentials Report", description: "Core financial overview including income, expenses, and net savings." },
  { to: "/reports/spending", title: "Spending Analysis", description: "Detailed breakdown of your spending by category and payee." },
  { to: "/reports/net-worth", title: "Net Worth Tracker", description: "Track your assets and liabilities over time to see your financial growth." },
  { to: "/reports/cash-flow", title: "Cash Flow Statement", description: "Monitor the flow of cash in and out of your accounts." },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { selectedCurrency, setSelectedCurrency: setCurrency, currencies: availableCurrencies } = useCurrency();
  const { user, userProfile, isLoadingUser } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    showSuccess("You have been logged out.");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "U";
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Wallet className="h-6 w-6" />
              <span className="">Finance Tracker</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {mainNavItems.map((item) => (
                item.label === "Reports" ? (
                  <NavigationMenu key={item.to} className="w-full max-w-full justify-start">
                    <NavigationMenuList>
                      <NavigationMenuItem className="w-full">
                        <NavigationMenuTrigger className={cn(
                          "w-full justify-start",
                          location.pathname.startsWith(item.to) && "bg-accent"
                        )}>
                          <div className="flex items-center gap-3">
                            {item.icon}
                            {item.label}
                          </div>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[200px] gap-3 p-4 md:w-[250px] lg:w-[300px]">
                            {reportNavItems.map((component) => (
                              <ListItem key={component.title} to={component.to} title={component.title}>
                                {component.description}
                              </ListItem>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      location.pathname === item.to && "bg-accent text-primary"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link to="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Wallet className="h-6 w-6" />
                  <span className="sr-only">Finance Tracker</span>
                </Link>
                {mainNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                      location.pathname === item.to && "bg-muted text-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Can add a global search here if needed */}
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedCurrency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[80px] sm:w-[100px]">
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
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={userProfile?.avatar_url || undefined} alt="User avatar" />
                    <AvatarFallback>
                      {isLoadingUser ? <User className="h-5 w-5" /> : getInitials(userProfile?.first_name, userProfile?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'My Account'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { to?: string }
>(({ className, title, children, to, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={to || "/"}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";