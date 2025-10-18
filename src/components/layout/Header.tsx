import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"; // Import SheetTitle and SheetDescription

const Header = () => {
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              {/* Add visually hidden SheetTitle and SheetDescription for accessibility */}
              <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation links for the application.</SheetDescription>
              <nav className="flex flex-col gap-4 p-4">
                <Link to="/dashboard" className="text-lg font-medium">Dashboard</Link>
                <Link to="/transactions" className="text-lg font-medium">Transactions</Link>
                <Link to="/analytics" className="text-lg font-medium">Analytics</Link>
                {/* Add more mobile links here */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;