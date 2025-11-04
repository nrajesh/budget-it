import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  Repeat,
  Banknote,
  Shapes,
  Users,
  Settings,
  Target,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/transactions", label: "Transactions", icon: Repeat },
  { to: "/accounts", label: "Accounts", icon: Banknote },
  { to: "/budgets", label: "Budgets", icon: Target },
  { to: "/categories", label: "Categories", icon: Shapes },
  { to: "/payees", label: "Payees", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <Banknote className="h-6 w-6" />
            <span className="">Finance Tracker</span>
          </NavLink>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}