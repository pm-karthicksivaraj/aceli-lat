"use client";

import { ViewType, COUNTRY_FLAGS, Country } from "@/lib/types";
import {
  LayoutDashboard,
  Building2,
  Mic,
  Brain,
  Wifi,
  WifiOff,
  Menu,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOnline: boolean;
  pendingSync: number;
  pendingReviews: number;
  onMenuToggle: () => void;
  selectedCountry: Country | null;
  onCountryChange: (country: Country | null) => void;
}

const VIEW_LABELS: Record<ViewType, string> = {
  dashboard: "Dashboard",
  lenders: "Lender Search",
  meetings: "Meeting Capture",
  review: "AI Review",
  offline: "Sync Status",
};

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];

export function Header({
  activeView,
  onViewChange,
  isOnline,
  pendingSync,
  pendingReviews,
  onMenuToggle,
  selectedCountry,
  onCountryChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-aceli flex items-center justify-center text-white font-bold text-xs md:hidden">
              A
            </div>
            <h1 className="font-semibold text-foreground">{VIEW_LABELS[activeView]}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Country quick filter */}
          <div className="hidden sm:flex items-center gap-1">
            {COUNTRIES.map((country) => (
              <button
                key={country}
                onClick={() => onCountryChange(country === selectedCountry ? null : country)}
                className={cn(
                  "px-2 py-1 rounded text-xs transition-colors",
                  selectedCountry === country
                    ? "bg-aceli text-white"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
                title={country}
              >
                {COUNTRY_FLAGS[country]}
              </button>
            ))}
          </div>

          {/* Connection indicator */}
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs",
              isOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
          </div>

          {/* Review badge */}
          {pendingReviews > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="relative text-xs h-8"
              onClick={() => onViewChange("review")}
            >
              <Brain className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Review</span>
              <Badge className="absolute -top-1.5 -right-1.5 h-4 px-1 text-[9px] bg-red-500 text-white">
                {pendingReviews}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex border-t border-border">
        {([
          { view: "dashboard" as ViewType, label: "Home", icon: LayoutDashboard },
          { view: "lenders" as ViewType, label: "Lenders", icon: Building2 },
          { view: "meetings" as ViewType, label: "Meet", icon: Mic },
          { view: "review" as ViewType, label: "Review", icon: Brain },
          { view: "offline" as ViewType, label: "Sync", icon: RefreshCw },
        ]).map((item) => {
          const Icon = item.icon;
          const badge = item.view === "review" ? pendingReviews : item.view === "offline" ? pendingSync : 0;

          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] relative transition-colors",
                activeView === item.view
                  ? "text-aceli"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
              {badge > 0 && (
                <span className="absolute top-1 right-1/4 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
