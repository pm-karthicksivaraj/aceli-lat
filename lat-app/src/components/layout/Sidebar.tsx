"use client";

import { cn } from "@/lib/utils";
import { ViewType, COUNTRY_FLAGS, Country } from "@/lib/types";
import {
  LayoutDashboard,
  Building2,
  Mic,
  Brain,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOnline: boolean;
  pendingSync: number;
  pendingReviews: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedCountry: Country | null;
  onCountryChange: (country: Country | null) => void;
}

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "lenders", label: "Lenders", icon: Building2 },
  { view: "meetings", label: "Meetings", icon: Mic },
  { view: "review", label: "AI Review", icon: Brain },
  { view: "offline", label: "Sync", icon: Wifi },
];

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];

export function Sidebar({
  activeView,
  onViewChange,
  isOnline,
  pendingSync,
  pendingReviews,
  collapsed,
  onToggleCollapse,
  selectedCountry,
  onCountryChange,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-aceli flex items-center justify-center text-white font-bold text-sm shrink-0">
          A
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm leading-tight text-sidebar-foreground">Aceli LAT</h1>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight">Lender Activation Tool</p>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="px-3 py-3">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs",
            isOnline
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          )}
        >
          {isOnline ? (
            <Wifi className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
          )}
          {!collapsed && <span>{isOnline ? "Online" : "Offline"}</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const badge = item.view === "review" ? pendingReviews : item.view === "offline" ? pendingSync : 0;

          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                activeView === item.view
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && badge > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-red-500 text-white">
                  {badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* Country Filter */}
      {!collapsed && (
        <>
          <Separator className="bg-sidebar-border" />
          <div className="px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 mb-2 px-2">
              Country Filter
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => onCountryChange(null)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors",
                  selectedCountry === null
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                )}
              >
                <span className="text-sm">🌍</span>
                <span>All Countries</span>
              </button>
              {COUNTRIES.map((country) => (
                <button
                  key={country}
                  onClick={() => onCountryChange(country === selectedCountry ? null : country)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors",
                    selectedCountry === country
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                  )}
                >
                  <span className="text-sm">{COUNTRY_FLAGS[country]}</span>
                  <span>{country}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Collapse Toggle */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
