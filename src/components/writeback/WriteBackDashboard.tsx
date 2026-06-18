"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowRightLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  AlertTriangle,
  Loader2,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WriteBackQueue, WriteBackStatus } from "@/lib/types";

const STATUS_CONFIG: Record<WriteBackStatus, { color: string; icon: React.ElementType; label: string }> = {
  Pending: { color: "bg-amber-100 text-amber-800", icon: Clock, label: "Pending" },
  Approved: { color: "bg-blue-100 text-blue-800", icon: CheckCircle, label: "Approved" },
  InProgress: { color: "bg-sky-100 text-sky-800", icon: Loader2, label: "In Progress" },
  Completed: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Completed" },
  Failed: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Failed" },
  RolledBack: { color: "bg-gray-100 text-gray-800", icon: RotateCcw, label: "Rolled Back" },
};

export function WriteBackDashboard() {
  const [writebacks, setWritebacks] = useState<WriteBackQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: "approve" | "execute" | "rollback" } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/writeback?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setWritebacks(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [statusFilter]);

  const refreshWritebacks = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/writeback?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setWritebacks(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/writeback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Approved",
          approvedBy: "field_officer",
        }),
      });
      if (res.ok) {
        setWritebacks((prev) =>
          prev.map((wb) =>
            wb.id === id ? { ...wb, status: "Approved" as WriteBackStatus } : wb
          )
        );
      }
    } catch {
      // Error
    } finally {
      setProcessingId(null);
      setConfirmDialog(null);
    }
  };

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    try {
      const res = await fetch(`/api/writeback/${id}/execute`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.writeback) {
          setWritebacks((prev) =>
            prev.map((wb) =>
              wb.id === id ? { ...wb, ...data.writeback } : wb
            )
          );
        }
      }
    } catch {
      // Error
    } finally {
      setExecutingId(null);
      setConfirmDialog(null);
    }
  };

  const handleRollback = async (id: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/writeback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RolledBack",
          reason: "Manual rollback by reviewer",
          performedBy: "field_officer",
        }),
      });
      refreshWritebacks();
    } catch {
      // Error
    } finally {
      setProcessingId(null);
      setConfirmDialog(null);
    }
  };

  const handleRetry = async (id: string) => {
    // Reset to Approved so it can be re-executed
    setProcessingId(id);
    try {
      await fetch(`/api/writeback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Approved",
          approvedBy: "field_officer",
        }),
      });
      // Now execute
      setProcessingId(null);
      setExecutingId(id);
      const res = await fetch(`/api/writeback/${id}/execute`, {
        method: "POST",
      });
      if (res.ok) {
        refreshWritebacks();
      }
    } catch {
      // Error
    } finally {
      setProcessingId(null);
      setExecutingId(null);
    }
  };

  // Summary counts
  const pendingCount = writebacks.filter((wb) => wb.status === "Pending").length;
  const approvedCount = writebacks.filter((wb) => wb.status === "Approved").length;
  const completedCount = writebacks.filter((wb) => wb.status === "Completed").length;
  const failedCount = writebacks.filter((wb) => wb.status === "Failed").length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className={cn("cursor-pointer transition-all", statusFilter === "Pending" && "ring-2 ring-amber-300")}
          onClick={() => setStatusFilter(statusFilter === "Pending" ? "all" : "Pending")}>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", statusFilter === "Approved" && "ring-2 ring-blue-300")}
          onClick={() => setStatusFilter(statusFilter === "Approved" ? "all" : "Approved")}>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-lg font-bold text-blue-600">{approvedCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", statusFilter === "Completed" && "ring-2 ring-green-300")}
          onClick={() => setStatusFilter(statusFilter === "Completed" ? "all" : "Completed")}>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <p className="text-lg font-bold text-green-600">{completedCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", statusFilter === "Failed" && "ring-2 ring-red-300")}
          onClick={() => setStatusFilter(statusFilter === "Failed" ? "all" : "Failed")}>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <p className="text-lg font-bold text-red-600">{failedCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="RolledBack">Rolled Back</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={refreshWritebacks}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Write-back Cards */}
      <ScrollArea className="max-h-[calc(100vh-360px)]">
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          ) : writebacks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ArrowRightLeft className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No write-back requests</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Approved extractions will appear here for write-back to Salesforce
                </p>
              </CardContent>
            </Card>
          ) : (
            writebacks.map((wb) => {
              const statusConfig = STATUS_CONFIG[wb.status as WriteBackStatus] || STATUS_CONFIG.Pending;
              const StatusIcon = statusConfig.icon;
              const isExecuting = executingId === wb.id;

              return (
                <Card
                  key={wb.id}
                  className={cn(
                    "transition-all",
                    wb.status === "Pending" && "border-l-4 border-l-amber-400",
                    wb.status === "Approved" && "border-l-4 border-l-blue-400",
                    wb.status === "Completed" && "border-l-4 border-l-green-400",
                    wb.status === "Failed" && "border-l-4 border-l-red-400",
                    wb.status === "RolledBack" && "border-l-4 border-l-gray-400"
                  )}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-blue-50">
                          <Cloud className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground">{wb.targetSystem}</span>
                            <Badge
                              variant="outline"
                              className={cn("text-[9px] h-4 px-1", statusConfig.color)}
                            >
                              {isExecuting ? (
                                <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                              ) : (
                                <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                              )}
                              {isExecuting ? "Executing..." : statusConfig.label}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {wb.targetObject} → {wb.targetField}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Value diff */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="p-2 bg-amber-50 rounded">
                        <p className="text-[9px] text-amber-600 font-medium mb-0.5">Proposed</p>
                        <p className="text-xs text-foreground truncate" title={wb.proposedValue}>
                          {wb.proposedValue}
                        </p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-[9px] text-muted-foreground font-medium mb-0.5">Current</p>
                        <p className="text-xs text-foreground truncate" title={wb.currentValue || "N/A"}>
                          {wb.currentValue || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Result */}
                    {wb.result && (
                      <div className={cn(
                        "mb-2 p-2 rounded text-xs",
                        wb.status === "Completed" ? "bg-green-50 text-green-800" :
                        wb.status === "Failed" ? "bg-red-50 text-red-800" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {wb.result}
                      </div>
                    )}

                    {/* Retry count */}
                    {wb.retryCount > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                        <AlertTriangle className="h-3 w-3" />
                        Retry count: {wb.retryCount}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                      {wb.status === "Pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => setConfirmDialog({ id: wb.id, action: "approve" })}
                          disabled={processingId === wb.id}
                        >
                          <CheckCircle className="h-3 w-3 mr-0.5" />
                          Approve
                        </Button>
                      )}
                      {wb.status === "Approved" && (
                        <Button
                          size="sm"
                          className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setConfirmDialog({ id: wb.id, action: "execute" })}
                          disabled={executingId === wb.id}
                        >
                          <Play className="h-3 w-3 mr-0.5" />
                          Execute Write-back
                        </Button>
                      )}
                      {wb.status === "Failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => handleRetry(wb.id)}
                          disabled={processingId === wb.id || executingId === wb.id}
                        >
                          <RefreshCw className="h-3 w-3 mr-0.5" />
                          Retry
                        </Button>
                      )}
                      {wb.status === "Completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => setConfirmDialog({ id: wb.id, action: "rollback" })}
                          disabled={processingId === wb.id}
                        >
                          <RotateCcw className="h-3 w-3 mr-0.5" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {confirmDialog?.action === "approve" && "Approve Write-back Request"}
              {confirmDialog?.action === "execute" && "Execute Write-back"}
              {confirmDialog?.action === "rollback" && "Rollback Write-back"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {confirmDialog?.action === "approve" && "This will approve the write-back request for execution. The data will NOT be written to Salesforce until you explicitly execute it."}
              {confirmDialog?.action === "execute" && "This will write the proposed value to Salesforce. This action will update live data in the target system."}
              {confirmDialog?.action === "rollback" && "This will mark this write-back as rolled back. Note: this does not revert the change in Salesforce automatically."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            {confirmDialog?.action === "approve" && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => confirmDialog && handleApprove(confirmDialog.id)}
                disabled={processingId === confirmDialog?.id}
              >
                Confirm Approval
              </Button>
            )}
            {confirmDialog?.action === "execute" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => confirmDialog && handleExecute(confirmDialog.id)}
                disabled={executingId === confirmDialog?.id}
              >
                Execute Now
              </Button>
            )}
            {confirmDialog?.action === "rollback" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => confirmDialog && handleRollback(confirmDialog.id)}
                disabled={processingId === confirmDialog?.id}
              >
                Rollback
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
