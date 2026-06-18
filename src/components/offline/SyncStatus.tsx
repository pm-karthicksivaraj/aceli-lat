"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  CloudOff,
  Upload,
  Check,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusProps {
  isOnline: boolean;
  pendingSync: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export function SyncStatus({ isOnline, pendingSync, isSyncing, onTriggerSync }: SyncStatusProps) {
  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className={cn(
        "transition-all",
        isOnline ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-full",
              isOnline ? "bg-green-100" : "bg-red-100"
            )}>
              {isOnline ? (
                <Wifi className="h-6 w-6 text-green-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <h3 className={cn(
                "font-semibold text-lg",
                isOnline ? "text-green-700" : "text-red-700"
              )}>
                {isOnline ? "Connected" : "Offline"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? "All changes will sync automatically"
                  : "Changes saved locally — sync when back online"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Cloud className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {pendingSync > 0 ? pendingSync : "✓"}
            </p>
            <p className="text-[10px] text-muted-foreground">Pending Sync</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CloudOff className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-[10px] text-muted-foreground">Failed Syncs</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Sync */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground">Manual Sync</h3>
            <Badge variant="outline" className="text-[10px]">
              {isOnline ? "Ready" : "Waiting for connection"}
            </Badge>
          </div>
          <Button
            onClick={onTriggerSync}
            disabled={isSyncing || !isOnline || pendingSync === 0}
            className="w-full bg-aceli hover:bg-aceli-dark text-white"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1.5" />
                Sync Now
              </>
            )}
          </Button>
          {pendingSync > 0 && (
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {pendingSync} item{pendingSync > 1 ? "s" : ""} waiting to sync
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sync Queue */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-aceli" />
            <h3 className="font-semibold text-sm text-foreground">Sync Queue</h3>
          </div>
          {pendingSync === 0 ? (
            <div className="text-center py-4">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All data is synced</p>
              <p className="text-xs text-muted-foreground mt-1">
                No pending items in the queue
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Show pending items */}
              <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800">
                    {pendingSync} meeting{pendingSync > 1 ? "s" : ""} pending
                  </p>
                  <p className="text-[10px] text-amber-600">
                    Will sync when connected
                  </p>
                </div>
                <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="h-4 w-4 text-aceli" />
            <h3 className="font-semibold text-sm text-foreground">Local Storage</h3>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">IndexedDB Usage</span>
                <span className="text-xs text-muted-foreground">Light</span>
              </div>
              <Progress value={12} className="h-1.5" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Draft data is stored locally in IndexedDB for offline access.
              Data is automatically uploaded when connection is restored.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
