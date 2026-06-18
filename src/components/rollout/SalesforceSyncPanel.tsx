"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Info,
  Plus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SyncLog {
  id: string;
  direction: string;
  operation: string;
  status: string;
  country: string | null;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
  triggeredBy: string;
  syncVersion: string | null;
  checksumBefore: string | null;
  checksumAfter: string | null;
  conflictCount: number;
  conflictsJson: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface SyncLogResponse {
  data: SyncLog[];
  pagination: Pagination;
}

interface ConflictEntry {
  field: string;
  local: string;
  remote: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"] as const;

const STATUS_BADGE_STYLES: Record<string, string> = {
  Completed: "bg-green-100 text-green-800 border-green-300",
  InProgress: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Pending: "bg-blue-100 text-blue-800 border-blue-300",
  Failed: "bg-red-100 text-red-800 border-red-300",
  PartiallyCompleted: "bg-orange-100 text-orange-800 border-orange-300",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  Completed: CheckCircle,
  InProgress: Clock,
  Pending: Clock,
  Failed: XCircle,
  PartiallyCompleted: AlertTriangle,
};

const DIRECTION_BADGE_STYLES: Record<string, string> = {
  Inbound: "bg-blue-100 text-blue-800 border-blue-300",
  Outbound: "bg-purple-100 text-purple-800 border-purple-300",
};

const DIRECTION_ICONS: Record<string, React.ElementType> = {
  Inbound: ArrowDownToLine,
  Outbound: ArrowUpFromLine,
};

const DIRECTION_LABELS: Record<string, string> = {
  Inbound: "Incoming",
  Outbound: "Outgoing",
};

const PAGE_SIZE = 10;

const INITIAL_FORM = {
  direction: "Inbound",
  operation: "FullSync",
  triggeredBy: "Admin",
  status: "Pending",
  country: "",
  recordsProcessed: 0,
  recordsSucceeded: 0,
  recordsFailed: 0,
  errorMessage: "",
  durationMs: 0,
  syncVersion: "",
  checksumBefore: "",
  checksumAfter: "",
  conflictCount: 0,
  conflictsJson: "",
};

// ─── Component ──────────────────────────────────────────────────────────────

export function SalesforceSyncPanel() {
  // Data state
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [direction, setDirection] = useState("all");
  const [status, setStatus] = useState("all");
  const [country, setCountry] = useState("all");
  const [page, setPage] = useState(1);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);

  // Create form state
  const [formData, setFormData] = useState({
    direction: "Inbound",
    operation: "FullSync",
    triggeredBy: "Admin",
    status: "Pending",
    country: "",
    recordsProcessed: 0,
    recordsSucceeded: 0,
    recordsFailed: 0,
    errorMessage: "",
    durationMs: 0,
    syncVersion: "",
    checksumBefore: "",
    checksumAfter: "",
    conflictCount: 0,
    conflictsJson: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch data ────────────────────────────────────────────────────────

  const fetchSyncLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (direction !== "all") params.set("direction", direction);
      if (status !== "all") params.set("status", status);
      if (country !== "all") params.set("country", country);

      const res = await fetch(`/api/salesforce-sync?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch sync logs");
      const json: SyncLogResponse = await res.json();
      setSyncLogs(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, direction, status, country]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await fetchSyncLogs();
    };
    load();
    return () => { cancelled = true; };
  }, [fetchSyncLogs]);

  // ─── Computed stats ────────────────────────────────────────────────────

  const totalSyncs = pagination.total;

  const computeSuccessRate = useCallback((): number => {
    if (syncLogs.length === 0) return 0;
    const completed = syncLogs.filter(
      (l) => l.status === "Completed" || l.status === "PartiallyCompleted"
    ).length;
    return Math.round((completed / syncLogs.length) * 100);
  }, [syncLogs]);

  const computeAvgDuration = useCallback((): number => {
    if (syncLogs.length === 0) return 0;
    const withDuration = syncLogs.filter((l) => l.durationMs > 0);
    if (withDuration.length === 0) return 0;
    const total = withDuration.reduce((sum, l) => sum + l.durationMs, 0);
    return Math.round(total / withDuration.length);
  }, [syncLogs]);

  const computeTotalConflicts = useCallback((): number => {
    return syncLogs.reduce((sum, l) => sum + l.conflictCount, 0);
  }, [syncLogs]);

  // ─── Sync Health ───────────────────────────────────────────────────────

  const getSyncHealth = useCallback((): {
    level: "healthy" | "degraded" | "critical";
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
  } => {
    if (syncLogs.length === 0) {
      return {
        level: "healthy",
        label: "No Data",
        color: "text-gray-600",
        bgColor: "bg-gray-50 border-gray-200",
        icon: Info,
      };
    }

    const recentLogs = syncLogs.slice(0, 10);
    const failed = recentLogs.filter(
      (l) => l.status === "Failed"
    ).length;
    const partiallyFailed = recentLogs.filter(
      (l) => l.status === "PartiallyCompleted"
    ).length;
    const failureRate = (failed + partiallyFailed * 0.5) / recentLogs.length;

    if (failureRate > 0.4) {
      return {
        level: "critical",
        label: "Critical — Many Failures",
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
        icon: XCircle,
      };
    }
    if (failureRate > 0.15) {
      return {
        level: "degraded",
        label: "Degraded — Some Failures",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
        icon: AlertTriangle,
      };
    }
    return {
      level: "healthy",
      label: "Healthy — Syncs Running Smoothly",
      color: "text-green-700",
      bgColor: "bg-green-50 border-green-200",
      icon: CheckCircle,
    };
  }, [syncLogs]);

  // ─── Form reset ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM);
  }, []);

  // ─── Create sync log ──────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    setSubmitting(true);
    try {
      const now = Date.now();
      const payload: Record<string, unknown> = {
        direction: formData.direction,
        operation: formData.operation,
        triggeredBy: formData.triggeredBy,
        status: formData.status,
        recordsProcessed: formData.recordsProcessed,
        recordsSucceeded: formData.recordsSucceeded,
        recordsFailed: formData.recordsFailed,
        durationMs: formData.durationMs,
        conflictCount: formData.conflictCount,
      };

      if (formData.country) payload.country = formData.country;
      if (formData.errorMessage) payload.errorMessage = formData.errorMessage;
      if (formData.syncVersion) payload.syncVersion = formData.syncVersion;
      if (formData.checksumBefore) payload.checksumBefore = formData.checksumBefore;
      if (formData.checksumAfter) payload.checksumAfter = formData.checksumAfter;
      if (formData.conflictsJson) payload.conflictsJson = formData.conflictsJson;

      if (formData.status === "Completed" || formData.status === "Failed" || formData.status === "PartiallyCompleted") {
        payload.startedAt = new Date(now - formData.durationMs).toISOString();
        payload.completedAt = new Date(now).toISOString();
      } else if (formData.status === "InProgress") {
        payload.startedAt = new Date(now).toISOString();
      }

      const res = await fetch("/api/salesforce-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.error || "Failed to create sync log");
      }

      setCreateDialogOpen(false);
      resetForm();
      fetchSyncLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sync log");
    } finally {
      setSubmitting(false);
    }
  }, [formData, fetchSyncLogs, resetForm]);

  // ─── Row click detail ─────────────────────────────────────────────────

  const handleRowClick = (log: SyncLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────

  const parseConflicts = (json: string | null): ConflictEntry[] => {
    if (!json) return [];
    try {
      return JSON.parse(json) as ConflictEntry[];
    } catch {
      return [];
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────

  const health = getSyncHealth();
  const HealthIcon = health.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Salesforce Bidirectional Sync</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage sync operations between LAT and Salesforce
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSyncLogs} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Sync Log
          </Button>
        </div>
      </div>

      {/* Sync Health Indicator */}
      <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border", health.bgColor)}>
        <HealthIcon className={cn("h-5 w-5 shrink-0", health.color)} />
        <div>
          <p className={cn("text-sm font-semibold", health.color)}>Sync Health: {health.label}</p>
          <p className="text-xs text-muted-foreground">
            Based on the most recent sync operations visible in current filters
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Direction</Label>
              <Select value={direction} onValueChange={(v) => { setDirection(v ?? "all"); setPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="Inbound">Inbound (Incoming)</SelectItem>
                  <SelectItem value="Outbound">Outbound (Outgoing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="PartiallyCompleted">Partially Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Country</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v ?? "all"); setPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Syncs</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{totalSyncs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={cn(
              "text-2xl font-bold",
              computeSuccessRate() >= 80 ? "text-green-600" : computeSuccessRate() >= 50 ? "text-yellow-600" : "text-red-600"
            )}>
              {computeSuccessRate()}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{computeAvgDuration().toLocaleString()} ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Conflicts</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={cn(
              "text-2xl font-bold",
              computeTotalConflicts() > 0 ? "text-orange-600" : "text-green-600"
            )}>
              {computeTotalConflicts()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
          <Button variant="ghost" size="sm" className="ml-auto text-red-600" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Sync Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sync Log History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && syncLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading sync logs...</span>
            </div>
          ) : syncLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Info className="h-8 w-8 mb-2" />
              <p className="text-sm">No sync logs found matching current filters.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Direction</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Operation</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Country</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Processed</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Succeeded</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Failed</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Duration</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Conflicts</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Triggered By</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncLogs.map((log) => {
                      const DirIcon = DIRECTION_ICONS[log.direction] || Info;
                      const StatusIcon = STATUS_ICONS[log.status] || Info;
                      return (
                        <tr
                          key={log.id}
                          onClick={() => handleRowClick(log)}
                          className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-4">
                            <Badge
                              variant="outline"
                              className={cn("gap-1", DIRECTION_BADGE_STYLES[log.direction] || "bg-gray-100 text-gray-800")}
                            >
                              <DirIcon className="h-3 w-3" />
                              {DIRECTION_LABELS[log.direction] || log.direction}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 font-medium">{log.operation}</td>
                          <td className="py-2.5 px-4">
                            <Badge
                              variant="outline"
                              className={cn("gap-1", STATUS_BADGE_STYLES[log.status] || "bg-gray-100 text-gray-800")}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {log.status === "PartiallyCompleted" ? "Partial" : log.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">
                            {log.country || "—"}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{log.recordsProcessed}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-green-600 font-medium">
                            {log.recordsSucceeded}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-red-600 font-medium">
                            {log.recordsFailed}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums">
                            {log.durationMs > 0 ? `${log.durationMs.toLocaleString()} ms` : "—"}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums">
                            {log.conflictCount > 0 ? (
                              <span className="text-orange-600 font-medium">{log.conflictCount}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">{log.triggeredBy}</td>
                          <td className="py-2.5 px-4 text-muted-foreground text-xs whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden space-y-3 p-4">
                {syncLogs.map((log) => {
                  const DirIcon = DIRECTION_ICONS[log.direction] || Info;
                  const StatusIcon = STATUS_ICONS[log.status] || Info;
                  return (
                    <div
                      key={log.id}
                      onClick={() => handleRowClick(log)}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("gap-1", DIRECTION_BADGE_STYLES[log.direction] || "")}
                          >
                            <DirIcon className="h-3 w-3" />
                            {DIRECTION_LABELS[log.direction] || log.direction}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("gap-1", STATUS_BADGE_STYLES[log.status] || "")}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {log.status === "PartiallyCompleted" ? "Partial" : log.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{log.country || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{log.operation}</span>
                        <span className="text-xs text-muted-foreground">{log.triggeredBy}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span>
                          <span className="text-green-600">{log.recordsSucceeded}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{log.recordsProcessed}</span>
                          <span className="text-muted-foreground ml-0.5">processed</span>
                        </span>
                        {log.recordsFailed > 0 && (
                          <span className="text-red-600">{log.recordsFailed} failed</span>
                        )}
                        {log.conflictCount > 0 && (
                          <span className="text-orange-600">{log.conflictCount} conflict{log.conflictCount > 1 ? "s" : ""}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                        {log.durationMs > 0 && ` — ${log.durationMs.toLocaleString()} ms`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, pagination.total)} of{" "}
                    {pagination.total} results
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(1)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-2 text-xs"
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      className="h-8 px-2 text-xs"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(pagination.totalPages)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {pagination.totalPages}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Create Sync Log Dialog ────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sync Log Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Required Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Direction <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.direction}
                  onValueChange={(v) => setFormData((f) => ({ ...f, direction: v ?? "Inbound" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                    <SelectItem value="Outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Operation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.operation}
                  onValueChange={(v) => setFormData((f) => ({ ...f, operation: v ?? "FullSync" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FullSync">Full Sync</SelectItem>
                    <SelectItem value="IncrementalSync">Incremental Sync</SelectItem>
                    <SelectItem value="SingleRecord">Single Record</SelectItem>
                    <SelectItem value="BulkUpdate">Bulk Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Triggered By <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.triggeredBy}
                  onValueChange={(v) => setFormData((f) => ({ ...f, triggeredBy: v ?? "Admin" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((f) => ({ ...f, status: v ?? "Pending" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="InProgress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="PartiallyCompleted">Partially Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Country</Label>
              <Select
                value={formData.country || "none"}
                onValueChange={(v) => setFormData((f) => ({ ...f, country: v === "none" ? "" : (v ?? "") }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (Global)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Global)</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Record Counts */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Records Processed</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.recordsProcessed}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, recordsProcessed: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Records Succeeded</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.recordsSucceeded}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, recordsSucceeded: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Records Failed</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.recordsFailed}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, recordsFailed: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Duration and Conflicts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Duration (ms)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.durationMs}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, durationMs: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Conflict Count</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.conflictCount}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, conflictCount: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Error Message</Label>
              <Textarea
                value={formData.errorMessage}
                onChange={(e) => setFormData((f) => ({ ...f, errorMessage: e.target.value }))}
                placeholder="Optional error message..."
                rows={2}
              />
            </div>

            {/* Advanced Fields (collapsible feel) */}
            <details className="group">
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Advanced Fields
              </summary>
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Sync Version</Label>
                  <Input
                    value={formData.syncVersion}
                    onChange={(e) => setFormData((f) => ({ ...f, syncVersion: e.target.value }))}
                    placeholder="e.g. 2025-01-15T10:00:00Z"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Checksum Before</Label>
                    <Input
                      value={formData.checksumBefore}
                      onChange={(e) => setFormData((f) => ({ ...f, checksumBefore: e.target.value }))}
                      placeholder="e.g. abc123"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Checksum After</Label>
                    <Input
                      value={formData.checksumAfter}
                      onChange={(e) => setFormData((f) => ({ ...f, checksumAfter: e.target.value }))}
                      placeholder="e.g. def456"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Conflicts JSON</Label>
                  <Textarea
                    value={formData.conflictsJson}
                    onChange={(e) => setFormData((f) => ({ ...f, conflictsJson: e.target.value }))}
                    placeholder='[{"field":"contactName","local":"John","remote":"Jon"}]'
                    rows={2}
                  />
                </div>
              </div>
            </details>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />}
              Create Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ─────────────────────────────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sync Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-2">
              {/* Header badges */}
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const DirIcon = DIRECTION_ICONS[selectedLog.direction] || Info;
                  return (
                    <Badge
                      variant="outline"
                      className={cn("gap-1", DIRECTION_BADGE_STYLES[selectedLog.direction] || "")}
                    >
                      <DirIcon className="h-3 w-3" />
                      {DIRECTION_LABELS[selectedLog.direction] || selectedLog.direction}
                    </Badge>
                  );
                })()}
                {(() => {
                  const StatusIcon = STATUS_ICONS[selectedLog.status] || Info;
                  return (
                    <Badge
                      variant="outline"
                      className={cn("gap-1", STATUS_BADGE_STYLES[selectedLog.status] || "")}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {selectedLog.status}
                    </Badge>
                  );
                })()}
                {selectedLog.country && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                    {selectedLog.country}
                  </Badge>
                )}
              </div>

              {/* Core Details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Operation</p>
                  <p className="font-medium">{selectedLog.operation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Triggered By</p>
                  <p className="font-medium">{selectedLog.triggeredBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Started At</p>
                  <p className="font-medium">{formatDate(selectedLog.startedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed At</p>
                  <p className="font-medium">{formatDate(selectedLog.completedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {selectedLog.durationMs > 0 ? `${selectedLog.durationMs.toLocaleString()} ms` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>

              {/* Record Counts */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Record Counts</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold">{selectedLog.recordsProcessed}</p>
                    <p className="text-[10px] text-muted-foreground">Processed</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-lg font-bold text-green-700">{selectedLog.recordsSucceeded}</p>
                    <p className="text-[10px] text-muted-foreground">Succeeded</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-lg font-bold text-red-700">{selectedLog.recordsFailed}</p>
                    <p className="text-[10px] text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <p className="text-lg font-bold text-orange-700">{selectedLog.conflictCount}</p>
                    <p className="text-[10px] text-muted-foreground">Conflicts</p>
                  </div>
                </div>
              </div>

              {/* Conflicts */}
              {selectedLog.conflictCount > 0 && (() => {
                const conflicts = parseConflicts(selectedLog.conflictsJson);
                return (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Conflicts ({selectedLog.conflictCount})
                    </p>
                    {conflicts.length > 0 ? (
                      <div className="space-y-2">
                        {conflicts.map((conflict, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm"
                          >
                            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-orange-800">Field: {conflict.field}</p>
                              <div className="flex items-center gap-2 text-xs text-orange-700 mt-0.5">
                                <span className="truncate">
                                  Local: <strong>{conflict.local}</strong>
                                </span>
                                <span className="text-orange-400">vs</span>
                                <span className="truncate">
                                  Remote: <strong>{conflict.remote}</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {selectedLog.conflictCount} conflict(s) reported (details not available in JSON)
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Error Message */}
              {selectedLog.errorMessage && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Error Message</p>
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 whitespace-pre-wrap">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              {/* Checksums */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Data Integrity</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-[10px] text-muted-foreground">Checksum Before</p>
                    <p className="text-xs font-mono mt-0.5 break-all">
                      {selectedLog.checksumBefore || "—"}
                    </p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-[10px] text-muted-foreground">Checksum After</p>
                    <p className="text-xs font-mono mt-0.5 break-all">
                      {selectedLog.checksumAfter || "—"}
                    </p>
                  </div>
                </div>
                {selectedLog.syncVersion && (
                  <div className="p-2 bg-muted/50 rounded mt-2">
                    <p className="text-[10px] text-muted-foreground">Sync Version</p>
                    <p className="text-xs font-mono mt-0.5">{selectedLog.syncVersion}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
