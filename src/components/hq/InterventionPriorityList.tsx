"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Brain, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InterventionPriority } from "@/lib/types";

const COUNTRY_FLAG_MAP: Record<string, string> = {
  Kenya: "🇰🇪",
  Uganda: "🇺🇬",
  Tanzania: "🇹🇿",
  Ethiopia: "🇪🇹",
  Nigeria: "🇳🇬",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

const PRIORITY_ICONS: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-600",
  medium: "text-amber-600",
  low: "text-green-600",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Dormant: "bg-gray-100 text-gray-800",
  New: "bg-blue-100 text-blue-800",
  "At-Risk": "bg-red-100 text-red-800",
};

type PriorityLevel = "critical" | "high" | "medium" | "low";

function getScoreColor(score: number): string {
  if (score > 70) return "text-green-700";
  if (score >= 40) return "text-amber-700";
  return "text-red-700";
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
      <div className="h-4 w-4 bg-muted rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-40 bg-muted rounded" />
        <div className="h-2 w-24 bg-muted rounded" />
      </div>
      <div className="h-5 w-14 bg-muted rounded-full" />
      <div className="h-5 w-12 bg-muted rounded-full" />
    </div>
  );
}

export function InterventionPriorityList() {
  const [interventions, setInterventions] = useState<InterventionPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PriorityLevel | "all">("all");

  useEffect(() => {
    async function fetchInterventions() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.set("priorityLevel", filter);
        }
        const res = await fetch(`/api/hq/interventions?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setInterventions(data);
        }
      } catch {
        // Error
      } finally {
        setLoading(false);
      }
    }
    fetchInterventions();
  }, [filter]);

  const filters: { label: string; value: PriorityLevel | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header + filter */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-aceli-navy flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-aceli" />
            Intervention Priority
          </h3>
        </div>
        <div className="flex gap-1 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter(f.value)}
              className="text-[10px]"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* List */}
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : interventions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No interventions found for this filter.
            </div>
          ) : (
            <div className="space-y-1">
              {interventions.map((item) => {
                const flag = COUNTRY_FLAG_MAP[item.country] || "🌍";
                return (
                  <div
                    key={item.lenderId}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    {/* Priority indicator */}
                    <div className="mt-0.5">
                      <AlertTriangle
                        className={cn("size-3.5", PRIORITY_ICONS[item.priorityLevel])}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.institutionName}
                        </span>
                        <span className="text-sm">{flag}</span>
                        <Badge
                          className={cn(
                            "text-[9px] h-4 px-1.5 border",
                            STATUS_BADGE_STYLES[item.relationshipStatus] || "bg-gray-100 text-gray-800"
                          )}
                        >
                          {item.relationshipStatus}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-[9px] h-4 px-1.5 border",
                            PRIORITY_STYLES[item.priorityLevel]
                          )}
                        >
                          {item.priorityLevel}
                        </Badge>
                      </div>

                      {/* Details row */}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className={cn("font-medium tabular-nums", getScoreColor(item.overallScore))}>
                          Score: {item.overallScore.toFixed(0)}
                        </span>
                        {item.daysSinceContact !== null && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="size-2.5" />
                            {item.daysSinceContact}d since contact
                          </span>
                        )}
                        {item.pendingReviews > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Brain className="size-2.5" />
                            {item.pendingReviews} pending
                          </span>
                        )}
                        {item.openExceptions > 0 && (
                          <span className="flex items-center gap-0.5 text-orange-600">
                            <AlertTriangle className="size-2.5" />
                            {item.openExceptions} exception{item.openExceptions > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Priority reasons */}
                      {item.priorityReasons.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {item.priorityReasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] text-muted-foreground before:content-['•'] before:mr-1 before:text-muted-foreground/60"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expand chevron */}
                    <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
