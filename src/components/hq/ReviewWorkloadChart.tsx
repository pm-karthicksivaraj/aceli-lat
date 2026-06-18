"use client";

import { useState, useEffect } from "react";
import { Users, Brain, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReviewWorkloadItem } from "@/lib/types";

function SkeletonBar() {
  return (
    <div className="space-y-2 py-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-3 w-8 bg-muted rounded ml-auto" />
      </div>
      <div className="h-3 w-full bg-muted rounded" />
    </div>
  );
}

export function ReviewWorkloadChart() {
  const [workload, setWorkload] = useState<ReviewWorkloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkload() {
      setLoading(true);
      try {
        const res = await fetch("/api/hq/workload");
        if (res.ok) {
          const data = await res.json();
          setWorkload(data);
        }
      } catch {
        // Error
      } finally {
        setLoading(false);
      }
    }
    fetchWorkload();
  }, []);

  // Separate "Unassigned" from reviewers
  const unassigned = workload.find((w) => w.reviewer === "Unassigned");
  const reviewers = workload.filter((w) => w.reviewer !== "Unassigned");

  // Max total for scaling bars
  const maxTotal = Math.max(
    ...workload.map((w) => w.pendingCount + w.approvedCount + w.rejectedCount + w.escalatedCount),
    1
  );

  function renderBar(item: ReviewWorkloadItem, isUnassigned = false) {
    const total = item.pendingCount + item.approvedCount + item.rejectedCount + item.escalatedCount;
    const pendingPct = total > 0 ? (item.pendingCount / maxTotal) * 100 : 0;
    const approvedPct = total > 0 ? (item.approvedCount / maxTotal) * 100 : 0;
    const rejectedPct = total > 0 ? (item.rejectedCount / maxTotal) * 100 : 0;
    const escalatedPct = total > 0 ? (item.escalatedCount / maxTotal) * 100 : 0;

    return (
      <div
        key={item.reviewer}
        className={cn(
          "space-y-1.5 py-2",
          isUnassigned && "border-b border-border/50 pb-3 mb-1"
        )}
      >
        {/* Row header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
            {isUnassigned ? "⚠️ Unassigned" : item.reviewer}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {item.totalReviewed} reviewed
            </span>
            {item.pendingCount > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-0.5">
                <ClockIcon className="size-2.5 text-amber-600" />
                {item.pendingCount}
              </Badge>
            )}
            {item.avgConfidenceScore > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground tabular-nums">
                <Brain className="size-2.5" />
                {(item.avgConfidenceScore * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Stacked bar */}
        <div className="h-4 w-full rounded-md bg-muted overflow-hidden flex">
          {item.pendingCount > 0 && (
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${pendingPct}%` }}
              title={`Pending: ${item.pendingCount}`}
            />
          )}
          {item.approvedCount > 0 && (
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${approvedPct}%` }}
              title={`Approved: ${item.approvedCount}`}
            />
          )}
          {item.rejectedCount > 0 && (
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${rejectedPct}%` }}
              title={`Rejected: ${item.rejectedCount}`}
            />
          )}
          {item.escalatedCount > 0 && (
            <div
              className="h-full bg-orange-400 transition-all"
              style={{ width: `${escalatedPct}%` }}
              title={`Escalated: ${item.escalatedCount}`}
            />
          )}
          {total === 0 && (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">No items</span>
            </div>
          )}
        </div>

        {/* Mini legend for this row */}
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          {item.pendingCount > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="inline-block size-1.5 rounded-full bg-amber-400" />
              {item.pendingCount} pending
            </span>
          )}
          {item.approvedCount > 0 && (
            <span className="flex items-center gap-0.5">
              <CheckCircle className="size-2.5 text-green-500" />
              {item.approvedCount}
            </span>
          )}
          {item.rejectedCount > 0 && (
            <span className="flex items-center gap-0.5">
              <XCircle className="size-2.5 text-red-500" />
              {item.rejectedCount}
            </span>
          )}
          {item.escalatedCount > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="inline-block size-1.5 rounded-full bg-orange-400" />
              {item.escalatedCount} escalated
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-aceli-navy flex items-center gap-1.5">
            <Users className="size-4 text-aceli" />
            Review Workload
          </h3>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <span className="inline-block size-1.5 rounded-full bg-amber-400" /> Pending
            </span>
            <span className="flex items-center gap-0.5">
              <span className="inline-block size-1.5 rounded-full bg-green-500" /> Approved
            </span>
            <span className="flex items-center gap-0.5">
              <span className="inline-block size-1.5 rounded-full bg-red-500" /> Rejected
            </span>
            <span className="flex items-center gap-0.5">
              <span className="inline-block size-1.5 rounded-full bg-orange-400" /> Escalated
            </span>
          </div>
        </div>

        {/* Chart area */}
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBar key={i} />
            ))}
          </div>
        ) : workload.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No workload data available.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {/* Unassigned first */}
            {unassigned && renderBar(unassigned, true)}
            {/* Reviewers */}
            {reviewers.map((item) => renderBar(item))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple clock icon for pending badge
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
