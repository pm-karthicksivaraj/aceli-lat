"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditLog, AuditAction } from "@/lib/types";

const ACTION_COLORS: Record<AuditAction, string> = {
  Create: "bg-green-100 text-green-800 border-green-300",
  Update: "bg-blue-100 text-blue-800 border-blue-300",
  Review: "bg-amber-100 text-amber-800 border-amber-300",
  Approve: "bg-green-100 text-green-800 border-green-300",
  Reject: "bg-red-100 text-red-800 border-red-300",
  Escalate: "bg-orange-100 text-orange-800 border-orange-300",
  WriteBack: "bg-purple-100 text-purple-800 border-purple-300",
  ExceptionRaised: "bg-red-100 text-red-800 border-red-300",
  ExceptionResolved: "bg-green-100 text-green-800 border-green-300",
};

const ACTION_DOT_COLORS: Record<AuditAction, string> = {
  Create: "bg-green-500",
  Update: "bg-blue-500",
  Review: "bg-amber-500",
  Approve: "bg-green-500",
  Reject: "bg-red-500",
  Escalate: "bg-orange-500",
  WriteBack: "bg-purple-500",
  ExceptionRaised: "bg-red-500",
  ExceptionResolved: "bg-green-500",
};

const ENTITY_ICONS: Record<string, string> = {
  Lender: "🏦",
  Meeting: "🎙️",
  Extraction: "🧠",
  WriteBack: "🔄",
  ExceptionQueue: "⚠️",
};

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDetails(details: string): string {
  try {
    const parsed = JSON.parse(details);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return details;
  }
}

export function AuditTimeline() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (entityTypeFilter && entityTypeFilter !== "all") params.set("entityType", entityTypeFilter);
    if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", page.toString());
    params.set("limit", "30");

    fetch(`/api/audit?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLogs(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [entityTypeFilter, actionFilter, startDate, endDate, page]);

  const refreshLogs = useCallback(() => {
    const params = new URLSearchParams();
    if (entityTypeFilter && entityTypeFilter !== "all") params.set("entityType", entityTypeFilter);
    if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", page.toString());
    params.set("limit", "30");

    fetch(`/api/audit?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLogs(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entityTypeFilter, actionFilter, startDate, endDate, page]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (entityTypeFilter && entityTypeFilter !== "all") params.set("entityType", entityTypeFilter);
      if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/audit/export?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Error
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="Lender">Lender</SelectItem>
                <SelectItem value="Meeting">Meeting</SelectItem>
                <SelectItem value="Extraction">Extraction</SelectItem>
                <SelectItem value="WriteBack">Write-back</SelectItem>
                <SelectItem value="ExceptionQueue">Exception</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="Create">Create</SelectItem>
                <SelectItem value="Update">Update</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Approve">Approve</SelectItem>
                <SelectItem value="Reject">Reject</SelectItem>
                <SelectItem value="Escalate">Escalate</SelectItem>
                <SelectItem value="WriteBack">Write-back</SelectItem>
                <SelectItem value="ExceptionRaised">Exception Raised</SelectItem>
                <SelectItem value="ExceptionResolved">Exception Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-[130px] h-8 text-xs"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              placeholder="Start date"
            />
            <Input
              type="date"
              className="w-[130px] h-8 text-xs"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              placeholder="End date"
            />
            <div className="flex items-center gap-1.5 ml-auto">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={refreshLogs}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download className="h-3 w-3 mr-1" />
                {exporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <ScrollArea className="max-h-[calc(100vh-280px)]">
        <div className="relative">
          {/* Timeline line */}
          {logs.length > 0 && (
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
          )}

          <div className="space-y-1">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse ml-10">
                  <CardContent className="p-3">
                    <div className="h-14 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            ) : logs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No audit logs found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Audit logs will appear as actions are performed
                  </p>
                </CardContent>
              </Card>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id && expandedId !== "";
                const actionColor = ACTION_COLORS[log.action as AuditAction] || ACTION_COLORS.Update;
                const actionDot = ACTION_DOT_COLORS[log.action as AuditAction] || ACTION_DOT_COLORS.Update;
                const entityIcon = ENTITY_ICONS[log.entityType] || "📝";
                const hashVerified = !!log.hash;

                return (
                  <div key={log.id} className="relative flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className={cn(
                      "w-[10px] h-[10px] rounded-full mt-3.5 z-10 shrink-0 border-2 border-background",
                      actionDot
                    )} />

                    {/* Card */}
                    <Card className="flex-1 transition-all hover:shadow-sm">
                      <CardContent className="p-3">
                        <div
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? "" : log.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-sm">{entityIcon}</span>
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] h-4 px-1 border", actionColor)}
                              >
                                {log.action}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {log.entityType} · {log.entityId.slice(-6)}
                              </span>
                              {hashVerified ? (
                                <ShieldCheck className="h-3 w-3 text-green-500" />
                              ) : (
                                <Shield className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(log.createdAt)}
                              <span>by {log.performedBy}</span>
                            </div>
                          </div>
                          <div className="shrink-0 ml-2">
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <pre className="text-[10px] text-muted-foreground bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {formatDetails(log.details)}
                            </pre>
                            {log.correlationId && (
                              <div className="mt-1.5 text-[10px] text-muted-foreground">
                                Correlation ID: <code className="bg-muted px-1 py-0.5 rounded text-[9px]">{log.correlationId}</code>
                              </div>
                            )}
                            {log.hash && (
                              <div className="mt-1 text-[10px] text-muted-foreground">
                                Hash: <code className="bg-muted px-1 py-0.5 rounded text-[9px]">{log.hash.slice(0, 16)}...</code>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
