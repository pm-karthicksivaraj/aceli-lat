"use client";

import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionIndicatorProps {
  isOnline: boolean;
}

export function ConnectionIndicator({ isOnline }: ConnectionIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
        isOnline
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      )}
    >
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <span className="font-medium text-xs">
        {isOnline ? "Online — Changes sync automatically" : "Offline — Changes saved locally"}
      </span>
    </div>
  );
}
