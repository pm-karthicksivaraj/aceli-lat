"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getConfidenceLevel, getConfidenceLabel } from "@/lib/types";

interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ConfidenceBadge({ score, showLabel = true, size = "sm" }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const label = getConfidenceLabel(score);

  const colorMap = {
    green: "bg-green-100 text-green-800 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    red: "bg-red-100 text-red-800 border-red-200",
  };

  const dotColorMap = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        colorMap[level],
        size === "sm" ? "text-[10px] h-5 px-1.5" : "text-xs h-6 px-2"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1", dotColorMap[level])} />
      {Math.round(score * 100)}%
      {showLabel && <span className="ml-1 opacity-70">· {label}</span>}
    </Badge>
  );
}
