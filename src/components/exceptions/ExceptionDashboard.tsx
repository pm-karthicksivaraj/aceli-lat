"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExceptionQueue, ExceptionType, ExceptionSeverity, ExceptionStatus } from "@/lib/types";

const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  MissingRequiredField: "Missing Field",
  LowConfidence: "Low Confidence",
  ConflictingValue: "Conflicting Value",
  InvalidStateTransition: "Invalid Transition",
  FailedSync: "Failed Sync",
  ReviewerRejection: "Reviewer Rejection",
};

const SEVERITY_COLORS: Record<ExceptionSeverity, { bg: string; text: string; dot: string; border: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", border: "border-l-red-500" },
  High: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", border: "border-l-orange-500" },
  Medium: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", border: "border-l-amber-500" },
  Low: { bg: "bg-yellow-50", text: "text-yellow-800", dot: "bg-yellow-500", border: "border-l-yellow-500" },
};

const STATUS_ICONS: Record<ExceptionStatus, React.ElementType> = {
  Open: AlertTriangle,
  InProgress: Clock,
  Resolved: CheckCircle,
  Dismissed: XCircle,
};

function getExceptionAge(createdAt: string): string {
  const hours = Math.floor((new Date(createdAt).getTime() - Date.now()) / (1000 * 60 * 60));
  const absHours = Math.abs(hours);
  if (absHours < 1) return "Just now";
  if (absHours < 24) return `${absHours}h ago`;
  const days = Math.floor(absHours / 24);
  return `${days}d ago`;
}

export function ExceptionDashboard() {
  const [exceptions, setExceptions] = useState<ExceptionQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("Open");
  const [resolveDialog, setResolveDialog] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    if (severityFilter && severityFilter !== "all") params.set("severity", severityFilter);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/exceptions?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setExceptions(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [typeFilter, severityFilter, statusFilter]);

  const refreshExceptions = useCallback(() => {
    const params = new URLSearchParams();
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    if (severityFilter && severityFilter !== "all") params.set("severity", severityFilter);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/exceptions?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setExceptions(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter, severityFilter, statusFilter]);

  const handleResolve = async (id: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/exceptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Resolved",
          resolution: resolutionNotes,
          resolvedBy: "field_officer",
        }),
      });
      setResolveDialog(null);
      setResolutionNotes("");
      refreshExceptions();
    } catch {
      // Error
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/exceptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Dismissed",
          performedBy: "field_officer",
        }),
      });
      refreshExceptions();
    } catch {
      // Error
    } finally {
      setProcessingId(null);
    }
  };

  const handleEscalate = async (id: string, currentSeverity: ExceptionSeverity) => {
    const escalationMap: Record<ExceptionSeverity, ExceptionSeverity> = {
      Low: "Medium",
      Medium: "High",
      High: "Critical",
      Critical: "Critical",
    };
    const newSeverity = escalationMap[currentSeverity];
    if (newSeverity === currentSeverity) return;

    setProcessingId(id);
    try {
      await fetch(`/api/exceptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          severity: newSeverity,
          performedBy: "field_officer",
        }),
      });
      refreshExceptions();
    } catch {
      // Error
    } finally {
      setProcessingId(null);
    }
  };

  // Summary counts
  const openCount = exceptions.filter((e) => e.status === "Open").length;
  const inProgressCount = exceptions.filter((e) => e.status === "InProgress").length;
  const resolvedCount = exceptions.filter((e) => e.status === "Resolved").length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={cn("cursor-pointer transition-all", statusFilter === "Open" && "ring-2 ring-red-300")}
          onClick={() => setStatusFilter(statusFilter === "Open" ? "all" : "Open")}>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <p className="text-lg font-bold text-red-600">{openCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", statusFilter === "InProgress" && "ring-2 ring-amber-300")}
          onClick={() => setStatusFilter(statusFilter === "InProgress" ? "all" : "InProgress")}>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-lg font-bold text-amber-600">{inProgressCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", statusFilter === "Resolved" && "ring-2 ring-green-300")}
          onClick={() => setStatusFilter(statusFilter === "Resolved" ? "all" : "Resolved")}>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <p className="text-lg font-bold text-green-600">{resolvedCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Exception Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="MissingRequiredField">Missing Field</SelectItem>
            <SelectItem value="LowConfidence">Low Confidence</SelectItem>
            <SelectItem value="ConflictingValue">Conflicting Value</SelectItem>
            <SelectItem value="InvalidStateTransition">Invalid Transition</SelectItem>
            <SelectItem value="FailedSync">Failed Sync</SelectItem>
            <SelectItem value="ReviewerRejection">Reviewer Rejection</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? "all")}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="InProgress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8 text-xs ml-auto" onClick={refreshExceptions}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Exception Cards */}
      <ScrollArea className="max-h-[calc(100vh-360px)]">
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          ) : exceptions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No exceptions found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All clear — no pending exceptions match your filters
                </p>
              </CardContent>
            </Card>
          ) : (
            exceptions.map((exception) => {
              const severityStyle = SEVERITY_COLORS[exception.severity as ExceptionSeverity] || SEVERITY_COLORS.Medium;
              const StatusIcon = STATUS_ICONS[exception.status as ExceptionStatus] || AlertTriangle;
              const isActive = exception.status === "Open" || exception.status === "InProgress";

              return (
                <Card
                  key={exception.id}
                  className={cn(
                    "transition-all border-l-4",
                    severityStyle.border,
                    !isActive && "opacity-60"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] h-5 px-1.5 border", severityStyle.bg, severityStyle.text)}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1", severityStyle.dot)} />
                            {exception.severity}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] h-5 px-1.5">
                            {EXCEPTION_TYPE_LABELS[exception.exceptionType as ExceptionType] || exception.exceptionType}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] h-5 px-1.5",
                              exception.status === "Open" && "bg-red-50 text-red-700",
                              exception.status === "InProgress" && "bg-amber-50 text-amber-700",
                              exception.status === "Resolved" && "bg-green-50 text-green-700",
                              exception.status === "Dismissed" && "bg-gray-50 text-gray-700"
                            )}
                          >
                            <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                            {exception.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed mb-1.5">
                          {exception.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {getExceptionAge(exception.createdAt)}
                          </span>
                          {exception.resolvedBy && (
                            <span>Resolved by {exception.resolvedBy}</span>
                          )}
                        </div>
                        {exception.resolution && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
                            <span className="font-medium">Resolution:</span> {exception.resolution}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {isActive && (
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => setResolveDialog(exception.id)}
                          disabled={processingId === exception.id}
                        >
                          <CheckCircle className="h-3 w-3 mr-0.5" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => handleDismiss(exception.id)}
                          disabled={processingId === exception.id}
                        >
                          <XCircle className="h-3 w-3 mr-0.5" />
                          Dismiss
                        </Button>
                        {exception.severity !== "Critical" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] border-orange-300 text-orange-700 hover:bg-orange-50"
                            onClick={() => handleEscalate(exception.id, exception.severity as ExceptionSeverity)}
                            disabled={processingId === exception.id}
                          >
                            <ArrowUp className="h-3 w-3 mr-0.5" />
                            Escalate
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Resolve Exception</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Add resolution notes to document how this exception was addressed.
            </p>
            <Textarea
              placeholder="Describe how this exception was resolved..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="min-h-[80px] text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResolveDialog(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => resolveDialog && handleResolve(resolveDialog)}
              disabled={processingId === resolveDialog || !resolutionNotes.trim()}
            >
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
