import { Link } from "react-router-dom";
import { SheetClose } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  BarChart2,
  Users,
  Wallet,
  Tag,
  Building,
  Calendar,
  ScrollText,
  PiggyBank,
  User,
  Bell,
  ChevronDown,
  Lightbulb,
} from "lucide-react"; // Importing icons

const MobileNavContent = () => {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-2 text-xl font-bold">
        <img src="/placeholder.svg" alt="Budget It! Logo" className="h-6 w-6" />
        Budget It!
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Dashboards
        </h3>
        <nav className="grid gap-2">
          <SheetClose asChild>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/analytics"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <BarChart2 className="h-4 w-4" />
              Analytics
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/insights"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Lightbulb className="h-4 w-4" />
              Insights
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/transactions"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted"
            >
              <Users className="h-4 w-4" />
              Transactions
            </Link>
          </SheetClose>
        </nav>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Management
        </h3>
        <nav className="grid gap-2">
          <SheetClose asChild>
            <Link
              to="/accounts"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Wallet className="h-4 w-4" />
              Accounts
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/categories"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Tag className="h-4 w-4" />
              Categories
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/vendors"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Building className="h-4 w-4" />
              Vendors
            </Link>
          </SheetClose>
        </nav>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Setup</h3>
        <nav className="grid gap-2">
          <SheetClose asChild>
            <Link
              to="/scheduled"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Calendar className="h-4 w-4" />
              Scheduled
            </Link>
          </SheetClose>
          {/* Reports with dropdown - simplified for now */}
          <div className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground hover:text-primary">
            <div className="flex items-center gap-3">
              <ScrollText className="h-4 w-4" />
              Reports
            </div>
            <ChevronDown className="h-4 w-4" />
          </div>
          <SheetClose asChild>
            <Link
              to="/budgets"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <PiggyBank className="h-4 w-4" />
              Budgets
            </Link>
          </SheetClose>
        </nav>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">User</h3>
        <nav className="grid gap-2">
          {/* User Profile with dropdown - simplified for now */}
          <div className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground hover:text-primary">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4" />
              User Profile
            </div>
            <ChevronDown className="h-4 w-4" />
          </div>
          <SheetClose asChild>
            <Link
              to="/notifications"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </Link>
          </SheetClose>
        </nav>
      </div>
    </div>
  );
};

export default MobileNavContent;
