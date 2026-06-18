"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { timeAgo } from "@/lib/utils";
import {
  FileText,
  Mic,
  Brain,
  Shield,
  RefreshCw,
  Clock,
} from "lucide-react";
import type { Activity } from "@/lib/types";

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  Note: FileText,
  Meeting: Mic,
  Extraction: Brain,
  Review: Shield,
  Sync: RefreshCw,
};

const ACTIVITY_COLORS: Record<string, string> = {
  Note: "bg-blue-100 text-blue-600",
  Meeting: "bg-aceli/10 text-aceli",
  Extraction: "bg-purple-100 text-purple-600",
  Review: "bg-green-100 text-green-600",
  Sync: "bg-gray-100 text-gray-600",
};

interface RecentActivityProps {
  activities: Activity[];
  loading: boolean;
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-aceli" />
          <h3 className="font-semibold text-sm text-foreground">Recent Activity</h3>
        </div>
        <ScrollArea className="max-h-80">
          <div className="space-y-1">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] || FileText;
                const colorClass = ACTIVITY_COLORS[activity.type] || "bg-gray-100 text-gray-600";

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-1.5 rounded-md ${colorClass} shrink-0 mt-0.5`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {activity.lender && (
                          <span className="text-[10px] text-muted-foreground">
                            {activity.lender.institutionName}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                      {activity.type}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
