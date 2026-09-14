import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThemeContext } from "./theme-provider";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Mail,
  Workflow,
  Trophy,
  Moon,
  Sun,
  Zap,
  Share2,
  Database,
  Menu,
  X,
  Radar,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/audience", label: "Audience Hub", icon: Users },
  { path: "/leads", label: "Lead Finder", icon: Radar },
  { path: "/campaigns", label: "Campaign Studio", icon: Mail },
  { path: "/journeys", label: "Automation", icon: Workflow },
  { path: "/sponsors", label: "Sponsor Room", icon: Trophy },
  { path: "/social", label: "Social Media", icon: Share2 },
  { path: "/import", label: "Data Import", icon: Database },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useThemeContext();
  const { director } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow-primary">
          <Zap className="h-5 w-5 text-primary-foreground" fill="currentColor" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-sidebar-foreground" style={{ fontFamily: "var(--font-display)" }}>
            PLAYER1
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-primary">
            Press Box
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
            {director?.name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "??"}
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-sidebar-foreground">{director?.name || director?.organization_name || "Guest"}</div>
            <div className="text-[10px] text-sidebar-foreground/50">{director?.role === "admin" ? "Admin" : "Tournament Director"}</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 flex flex-col border-r border-sidebar-border bg-sidebar animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 md:h-16 items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm md:text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {navItems.find((i) => {
                if (i.path === "/") return location === "/";
                return location.startsWith(i.path);
              })?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-9 w-9"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/campaigns">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 hidden sm:inline-flex"
                data-testid="button-new-campaign"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                New Campaign
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button
                size="icon"
                className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 sm:hidden"
                data-testid="button-new-campaign-mobile"
              >
                <Zap className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
          <div className="mx-auto max-w-7xl p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
