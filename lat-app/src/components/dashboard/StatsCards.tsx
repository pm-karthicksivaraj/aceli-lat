"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Mic,
  Brain,
  RefreshCw,
  Users,
  TrendingUp,
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Lenders",
      value: stats.totalLenders,
      icon: Building2,
      color: "text-aceli",
      bgColor: "bg-aceli/10",
      subtext: `${stats.lendersByStatus.Active || 0} active`,
    },
    {
      label: "Active Meetings",
      value: stats.activeMeetings,
      icon: Mic,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      subtext: "In progress",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: Brain,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      subtext: "AI extractions",
    },
    {
      label: "Sync Pending",
      value: stats.syncPending,
      icon: RefreshCw,
      color: stats.syncPending > 0 ? "text-red-600" : "text-green-600",
      bgColor: stats.syncPending > 0 ? "bg-red-50" : "bg-green-50",
      subtext: stats.syncPending > 0 ? "Needs attention" : "All synced",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{card.subtext}</p>
                </div>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface CountryBreakdownProps {
  stats: DashboardStats | null;
}

export function CountryBreakdown({ stats }: CountryBreakdownProps) {
  if (!stats) return null;

  const countries = Object.entries(stats.lendersByCountry).sort(
    ([, a], [, b]) => b - a
  );
  const maxCount = Math.max(...Object.values(stats.lendersByCountry), 1);

  const COUNTRY_FLAGS: Record<string, string> = {
    Kenya: "🇰🇪",
    Uganda: "🇺🇬",
    Tanzania: "🇹🇿",
    Ethiopia: "🇪🇹",
    Nigeria: "🇳🇬",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-aceli" />
          <h3 className="font-semibold text-sm text-foreground">Lenders by Country</h3>
        </div>
        <div className="space-y-2.5">
          {countries.map(([country, count]) => (
            <div key={country}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground flex items-center gap-1.5">
                  <span>{COUNTRY_FLAGS[country] || "🌍"}</span>
                  {country}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{count}</span>
              </div>
              <Progress value={(count / maxCount) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatusBreakdownProps {
  stats: DashboardStats | null;
}

export function StatusBreakdown({ stats }: StatusBreakdownProps) {
  if (!stats) return null;

  const statuses = Object.entries(stats.lendersByStatus);
  const total = statuses.reduce((sum, [, count]) => sum + count, 0);

  const STATUS_COLORS: Record<string, string> = {
    Active: "bg-green-500",
    Dormant: "bg-gray-400",
    New: "bg-blue-500",
    "At-Risk": "bg-red-500",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-aceli" />
          <h3 className="font-semibold text-sm text-foreground">Relationship Status</h3>
        </div>
        <div className="space-y-2">
          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden h-2.5">
            {statuses.map(([status, count]) => (
              <div
                key={status}
                className={`${STATUS_COLORS[status] || "bg-gray-400"}`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {statuses.map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || "bg-gray-400"}`} />
                <span className="text-[10px] text-muted-foreground">
                  {status}: {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
