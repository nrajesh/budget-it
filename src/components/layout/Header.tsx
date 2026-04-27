import { Link } from "react-router-dom";
import { Menu, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import React from "react";
import MobileNavContent from "../navigation/MobileNavContent.tsx"; // Explicitly added .tsx extension
import { useTour } from "@/contexts/TourContext";
import { useTranslation } from "react-i18next";

const Header = () => {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { startTour, hasTourForCurrentRoute } = useTour();
  const { t } = useTranslation();

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
              {t("layout.nav.dashboard", { defaultValue: "Dashboard" })}
            </Link>
            <Link
              to="/transactions"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {t("layout.nav.transactions", { defaultValue: "Transactions" })}
            </Link>
            <Link
              to="/analytics"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {t("layout.nav.analytics", { defaultValue: "Analytics" })}
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          {hasTourForCurrentRoute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={startTour}
              aria-label={t("helpTour.start", { defaultValue: "Start Help Tour" })}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}
          {/* User/Auth related stuff */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">
                  {t("layout.nav.toggleMenu", { defaultValue: "Toggle menu" })}
                </span>
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
