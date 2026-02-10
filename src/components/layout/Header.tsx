import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import React from "react";
import MobileNavContent from "../navigation/MobileNavContent.tsx"; // Explicitly added .tsx extension

const Header = () => {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-lg font-bold">
            My App
          </Link>
          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-4">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/transactions"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Transactions
            </Link>
            <Link
              to="/analytics"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Analytics
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {/* User/Auth related stuff */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
              <MobileNavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
