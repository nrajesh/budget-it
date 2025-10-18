"use client";

import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Home, ListChecks, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            My App
          </Link>
          <nav>
            <ul className="flex space-x-4">
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
                  <Link to="/analytics">
                    <BarChart2 className="mr-2 h-4 w-4" /> Analytics
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="/about">About</Link>
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
    </div>
  );
};

export default Layout;