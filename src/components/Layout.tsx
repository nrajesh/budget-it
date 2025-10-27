"use client";

import React, { useState } from "react";
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  ShoppingCart,
  Users,
  Settings,
  PlusCircle,
  FileUp,
  CalendarClock,
  Wallet,
  Landmark,
  Tags,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { useCurrency } from "@/contexts/CurrencyContext";

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/transactions", icon: ShoppingCart, label: "Transactions" },
  { href: "/scheduled", icon: CalendarClock, label: "Scheduled" },
  { href: "/accounts", icon: Landmark, label: "Accounts" },
  { href: "/vendors", icon: Wallet, label: "Vendors" },
  { href: "/categories", icon: Tags, label: "Categories" },
  { href: "/budgets", icon: Package, label: "Budgets" },
  { href: "/reports", icon: LineChart, label: "Reports" },
];

const Layout = () => {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const location = useLocation();

  const getTitle = () => {
    const currentPath = location.pathname;
    const activeItem = navItems.find(item => item.href === currentPath);
    if (activeItem) return activeItem.label;
    if (currentPath.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        {/* ... sidebar content ... */}
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Header content */}
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold">{getTitle()}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsAddTransactionOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
      <AddTransactionDialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen} />
    </div>
  );
};

export default Layout;