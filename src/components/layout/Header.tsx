import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"; // Import SheetClose
import React from "react";

const Header = () => {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false); // State to control sheet visibility

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-lg font-bold">
            My App
          </Link>
          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-4">
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">Dashboard</Link>
            <Link to="/transactions" className="text-sm font-medium text-muted-foreground hover:text-primary">Transactions</Link>
            <Link to="/analytics" className="text-sm font-medium text-muted-foreground hover:text-primary">Analytics</Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {/* User/Auth related stuff */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}> {/* Control sheet with state */}
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 p-4">
                {/* Wrap each Link with SheetClose */}
                <SheetClose asChild>
                  <Link to="/dashboard" className="text-lg font-medium">Dashboard</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/transactions" className="text-lg font-medium">Transactions</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/analytics" className="text-lg font-medium">Analytics</Link>
                </SheetClose>
                {/* Add more mobile links here, wrapped with SheetClose */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;