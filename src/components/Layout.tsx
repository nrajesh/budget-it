"use client";

import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Home, ListChecks, BarChart2, Wallet, Tag, Users, Calendar, DollarSign, Settings, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddTransactionDialog } from "./AddTransactionDialog"; // Corrected import

const Layout = () => {
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            My App
          </Link>
          <nav>
            <ul className="flex space-x-4 items-center">
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" /> Home
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/transactions">
                    <ListChecks className="mr-2 h-4 w-4" /> Transactions
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/accounts">
                    <Wallet className="mr-2 h-4 w-4" /> Accounts
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/categories">
                    <Tag className="mr-2 h-4 w-4" /> Categories
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/vendors">
                    <Users className="mr-2 h-4 w-4" /> Vendors
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/scheduled-transactions">
                    <Calendar className="mr-2 h-4 w-4" /> Scheduled
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/budgets">
                    <DollarSign className="mr-2 h-4 w-4" /> Budgets
                  </Link>
                </Button>
              </li>
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <BarChart2 className="mr-2 h-4 w-4" /> Reports
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Report Types</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/reports/essential">Essential Reports</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/reports/advanced">Advanced Reports</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </Button>
              </li>
              <li>
                <Button onClick={() => setIsAddTransactionDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-secondary text-secondary-foreground p-4 text-center">
        <div className="container mx-auto">
          © {new Date().getFullYear()} My App. All rights reserved.
        </div>
      </footer>

      <AddTransactionDialog
        isOpen={isAddTransactionDialogOpen}
        onOpenChange={setIsAddTransactionDialogOpen}
      />
    </div>
  );
};

export default Layout;