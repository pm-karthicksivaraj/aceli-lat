"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Shield,
  Activity,
  Bell,
  XCircle,
  Plus,
  Eye,
  Ban,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlertType =
  | "SyncFailure"
  | "HighErrorRate"
  | "LowAdoption"
  | "PerformanceDegradation"
  | "DataIntegrity"
  | "ServiceOutage"
  | "ConfigurationDrift";

type Severity = "Info" | "Warning" | "Error" | "Critical";

type AlertStatus = "Active" | "Acknowledged" | "Resolved" | "Suppressed";

type Source =
  | "System"
  | "SyncEngine"
  | "AdoptionTracker"
  | "PerformanceMonitor"
  | "DataValidator";

interface MonitoringAlert {
  id: string;
  alertType: AlertType;
  severity: Severity;
  status: AlertStatus;
  country: string | null;
  source: Source;
  title: string;
  description: string;
  metricName: string | null;
  metricValue: number | null;
  thresholdValue: number | null;
  affectedEntities: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  suppressionReason: string | null;
  suppressedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AlertsResponse {
  data: MonitoringAlert[];
  pagination: Pagination;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "SyncFailure", label: "Sync Failure" },
  { value: "HighErrorRate", label: "High Error Rate" },
  { value: "LowAdoption", label: "Low Adoption" },
  { value: "PerformanceDegradation", label: "Performance Degradation" },
  { value: "DataIntegrity", label: "Data Integrity" },
  { value: "ServiceOutage", label: "Service Outage" },
  { value: "ConfigurationDrift", label: "Configuration Drift" },
];

const SEVERITY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Severities" },
  { value: "Info", label: "Info" },
  { value: "Warning", label: "Warning" },
  { value: "Error", label: "Error" },
  { value: "Critical", label: "Critical" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Acknowledged", label: "Acknowledged" },
  { value: "Resolved", label: "Resolved" },
  { value: "Suppressed", label: "Suppressed" },
];

const COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Countries" },
  { value: "Kenya", label: "Kenya" },
  { value: "India", label: "India" },
  { value: "Colombia", label: "Colombia" },
  { value: "Peru", label: "Peru" },
  { value: "Uganda", label: "Uganda" },
  { value: "Global", label: "Global" },
];

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "System", label: "System" },
  { value: "SyncEngine", label: "Sync Engine" },
  { value: "AdoptionTracker", label: "Adoption Tracker" },
  { value: "PerformanceMonitor", label: "Performance Monitor" },
  { value: "DataValidator", label: "Data Validator" },
];

const SEVERITY_STYLES: Record<
  Severity,
  { border: string; bg: string; text: string; icon: React.ElementType }
> = {
  Critical: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: XCircle,
  },
  Error: {
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    icon: AlertCircle,
  },
  Warning: {
    border: "border-l-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    icon: AlertTriangle,
  },
  Info: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: Info,
  },
};

const ALERT_TYPE_ICONS: Record<AlertType, React.ElementType> = {
  SyncFailure: AlertCircle,
  HighErrorRate: AlertTriangle,
  LowAdoption: Activity,
  PerformanceDegradation: Activity,
  DataIntegrity: Shield,
  ServiceOutage: XCircle,
  ConfigurationDrift: AlertTriangle,
};

const SEVERITY_BADGE_VARIANT: Record<Severity, "destructive" | "outline" | "secondary" | "default"> = {
  Critical: "destructive",
  Error: "destructive",
  Warning: "outline",
  Info: "secondary",
};

const STATUS_BADGE_CLASSES: Record<AlertStatus, string> = {
  Active: "bg-red-100 text-red-800 border-red-200",
  Acknowledged: "bg-amber-100 text-amber-800 border-amber-200",
  Resolved: "bg-green-100 text-green-800 border-green-200",
  Suppressed: "bg-gray-100 text-gray-800 border-gray-200",
};

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getHealthLevel(alerts: MonitoringAlert[]): {
  level: "green" | "yellow" | "red";
  label: string;
} {
  const active = alerts.filter((a) => a.status === "Active");
  const criticalActive = active.filter((a) => a.severity === "Critical");
  const errorActive = active.filter((a) => a.severity === "Error");

  if (criticalActive.length > 0) {
    return { level: "red", label: "Critical Issues Detected" };
  }
  if (errorActive.length > 0) {
    return { level: "yellow", label: "Errors Present" };
  }
  return { level: "green", label: "All Systems Healthy" };
}

const HEALTH_DOT: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

const HEALTH_BG: Record<string, string> = {
  green: "bg-green-50 text-green-800 border-green-200",
  yellow: "bg-yellow-50 text-yellow-800 border-yellow-200",
  red: "bg-red-50 text-red-800 border-red-200",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MonitoringDashboard() {
  // Data state
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [alertType, setAlertType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [country, setCountry] = useState("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);

  // Dialog state
  const [suppressDialog, setSuppressDialog] = useState<string | null>(null);
  const [suppressionReason, setSuppressionReason] = useState("");
  const [createDialog, setCreateDialog] = useState(false);

  // Create alert form state
  const [newAlert, setNewAlert] = useState({
    alertType: "SyncFailure" as AlertType,
    source: "System" as Source,
    severity: "Warning" as Severity,
    title: "",
    description: "",
    country: "",
    metricName: "",
    metricValue: "",
    thresholdValue: "",
    affectedEntities: "",
  });

  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Fetch alerts (inline in effect to satisfy lint rule)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    if (alertType !== "all") params.set("alertType", alertType);
    if (severity !== "all") params.set("severity", severity);
    if (status !== "all") params.set("status", status);
    if (country !== "all") params.set("country", country);
    if (source !== "all") params.set("source", source);

    fetch(`/api/monitoring/alerts?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`);
        return res.json();
      })
      .then((json: AlertsResponse) => {
        setAlerts(json.data);
        setPagination(json.pagination);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load alerts");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [page, alertType, severity, status, country, source]);

  // Callback for manual refresh (e.g. after an action)
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (alertType !== "all") params.set("alertType", alertType);
      if (severity !== "all") params.set("severity", severity);
      if (status !== "all") params.set("status", status);
      if (country !== "all") params.set("country", country);
      if (source !== "all") params.set("source", source);

      const res = await fetch(`/api/monitoring/alerts?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`);
      const json: AlertsResponse = await res.json();
      setAlerts(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [page, alertType, severity, status, country, source]);

  // Helper to reset page and update a filter simultaneously
  const updateFilter = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (v: string | null) => {
        setter(v ?? "all");
        setPage(1);
      },
    []
  );

  // -------------------------------------------------------------------------
  // Alert actions
  // -------------------------------------------------------------------------
  const patchAlert = async (
    id: string,
    body: Record<string, unknown>
  ): Promise<boolean> => {
    setProcessingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/monitoring/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Action failed: ${res.status}`);
      await fetchAlerts();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  const handleAcknowledge = (id: string) => {
    patchAlert(id, {
      status: "Acknowledged",
      acknowledgedBy: "admin",
    });
  };

  const handleResolve = (id: string) => {
    patchAlert(id, {
      status: "Resolved",
      resolvedBy: "admin",
      resolution: "Fixed",
    });
  };

  const handleSuppress = async () => {
    if (!suppressDialog || !suppressionReason.trim()) return;
    const success = await patchAlert(suppressDialog, {
      status: "Suppressed",
      suppressionReason: suppressionReason.trim(),
    });
    if (success) {
      setSuppressDialog(null);
      setSuppressionReason("");
    }
  };

  const handleCreateAlert = async () => {
    try {
      const body: Record<string, unknown> = {
        alertType: newAlert.alertType,
        source: newAlert.source,
        title: newAlert.title,
        description: newAlert.description,
        severity: newAlert.severity,
      };
      if (newAlert.country) body.country = newAlert.country;
      if (newAlert.metricName) body.metricName = newAlert.metricName;
      if (newAlert.metricValue)
        body.metricValue = parseFloat(newAlert.metricValue);
      if (newAlert.thresholdValue)
        body.thresholdValue = parseFloat(newAlert.thresholdValue);
      if (newAlert.affectedEntities) {
        try {
          body.affectedEntities = JSON.parse(newAlert.affectedEntities);
        } catch {
          body.affectedEntities = newAlert.affectedEntities
            .split(",")
            .map((s) => s.trim());
        }
      }

      const res = await fetch("/api/monitoring/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      setCreateDialog(false);
      setNewAlert({
        alertType: "SyncFailure",
        source: "System",
        severity: "Warning",
        title: "",
        description: "",
        country: "",
        metricName: "",
        metricValue: "",
        thresholdValue: "",
        affectedEntities: "",
      });
      await fetchAlerts();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Create failed");
    }
  };

  // -------------------------------------------------------------------------
  // Computed values
  // -------------------------------------------------------------------------
  const health = getHealthLevel(alerts);

  const activeCount = alerts.filter((a) => a.status === "Active").length;
  const criticalCount = alerts.filter(
    (a) => a.status === "Active" && a.severity === "Critical"
  ).length;
  const acknowledgedToday = alerts.filter((a) => {
    if (a.status !== "Acknowledged" || !a.acknowledgedAt) return false;
    const d = new Date(a.acknowledgedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const resolvedToday = alerts.filter((a) => {
    if (a.status !== "Resolved" || !a.resolvedAt) return false;
    const d = new Date(a.resolvedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            System Monitoring
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor alerts and system health across all countries
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* System Health Indicator */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium",
              HEALTH_BG[health.level]
            )}
          >
            <span
              className={cn(
                "inline-block size-2.5 rounded-full",
                HEALTH_DOT[health.level]
              )}
            />
            {health.label}
          </div>
          <Button onClick={() => setCreateDialog(true)} size="sm">
            <Plus className="size-4" />
            New Alert
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Bell className="size-4 text-orange-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <XCircle className="size-4 text-red-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {criticalCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="size-4 text-amber-500" />
              Acknowledged Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acknowledgedToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle className="size-4 text-green-500" />
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {/* Alert Type */}
            <Select
              value={alertType}
              onValueChange={updateFilter(setAlertType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                {ALERT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Severity */}
            <Select
              value={severity}
              onValueChange={updateFilter(setSeverity)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={status}
              onValueChange={updateFilter(setStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Country */}
            <Select
              value={country}
              onValueChange={updateFilter(setCountry)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Source */}
            <Select
              value={source}
              onValueChange={updateFilter(setSource)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Error */}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
          <button
            className="ml-2 font-medium underline"
            onClick={() => setActionError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Activity className="size-8 animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <AlertTriangle className="size-8 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAlerts}>
            Retry
          </Button>
        </div>
      )}

      {/* Alert Cards */}
      {!loading && !error && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto mb-2 size-8 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  No alerts match the current filters
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => {
              const sevStyle = SEVERITY_STYLES[alert.severity];
              const TypeIcon = ALERT_TYPE_ICONS[alert.alertType];
              const isProcessing = processingId === alert.id;
              const isActionable =
                alert.status === "Active" || alert.status === "Acknowledged";

              return (
                <Card
                  key={alert.id}
                  className={cn(
                    "border-l-4 transition-shadow hover:shadow-md",
                    sevStyle.border
                  )}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      {/* Top row: icon + title + badges */}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg",
                            sevStyle.bg,
                            sevStyle.text
                          )}
                        >
                          <TypeIcon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold leading-snug">
                              {alert.title}
                            </h3>
                            <Badge variant={SEVERITY_BADGE_VARIANT[alert.severity]} className="text-xs">
                              {alert.severity}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                STATUS_BADGE_CLASSES[alert.status]
                              )}
                            >
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {alert.description}
                          </p>
                        </div>
                      </div>

                      {/* Metric info */}
                      {alert.metricName && alert.metricValue !== null && alert.thresholdValue !== null && (
                        <div className="ml-12 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <span className="text-muted-foreground">
                            Metric:{" "}
                            <span className="font-medium text-foreground">
                              {alert.metricName}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Current:{" "}
                            <span className="font-semibold text-red-600">
                              {alert.metricValue}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Threshold:{" "}
                            <span className="font-medium text-foreground">
                              {alert.thresholdValue}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Badges row: country, source, time */}
                      <div className="ml-12 flex flex-wrap items-center gap-2">
                        {alert.country && (
                          <Badge variant="secondary" className="text-xs">
                            {alert.country}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {alert.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(alert.createdAt)}
                        </span>
                      </div>

                      {/* Acknowledged/Resolved info */}
                      {alert.acknowledgedBy && alert.acknowledgedAt && (
                        <div className="ml-12 text-xs text-muted-foreground">
                          Acknowledged by{" "}
                          <span className="font-medium">
                            {alert.acknowledgedBy}
                          </span>{" "}
                          &middot; {formatTimeAgo(alert.acknowledgedAt)}
                        </div>
                      )}
                      {alert.resolvedBy && alert.resolvedAt && (
                        <div className="ml-12 text-xs text-muted-foreground">
                          Resolved by{" "}
                          <span className="font-medium">
                            {alert.resolvedBy}
                          </span>{" "}
                          &middot; {formatTimeAgo(alert.resolvedAt)}
                          {alert.resolution && (
                            <>
                              {" "}
                              &middot;{" "}
                              <span className="italic">
                                {alert.resolution}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {alert.suppressionReason && (
                        <div className="ml-12 text-xs text-muted-foreground">
                          Suppressed:{" "}
                          <span className="italic">
                            {alert.suppressionReason}
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      {isActionable && (
                        <div className="ml-12 flex flex-wrap items-center gap-2">
                          {alert.status === "Active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              <Eye className="size-3.5" />
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            onClick={() => handleResolve(alert.id)}
                          >
                            <CheckCircle className="size-3.5" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isProcessing}
                            onClick={() => {
                              setSuppressDialog(alert.id);
                              setSuppressionReason("");
                            }}
                          >
                            <Ban className="size-3.5" />
                            Suppress
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, pagination.total)} of{" "}
                {pagination.total} alerts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Suppress Dialog */}
      {/* ------------------------------------------------------------------- */}
      <Dialog
        open={!!suppressDialog}
        onOpenChange={(open) => {
          if (!open) {
            setSuppressDialog(null);
            setSuppressionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suppress Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Enter a reason for suppressing this alert. Suppressed alerts will
              not trigger notifications.
            </p>
            <div className="space-y-2">
              <Label htmlFor="suppression-reason">Suppression Reason</Label>
              <Textarea
                id="suppression-reason"
                placeholder="Enter reason for suppressing this alert..."
                value={suppressionReason}
                onChange={(e) => setSuppressionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuppressDialog(null);
                setSuppressionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuppress}
              disabled={!suppressionReason.trim() || !!processingId}
            >
              Suppress Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------- */}
      {/* Create Alert Dialog */}
      {/* ------------------------------------------------------------------- */}
      <Dialog
        open={createDialog}
        onOpenChange={(open) => {
          if (!open) setCreateDialog(false);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Alert</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-2">
            {/* Alert Type */}
            <div className="space-y-2">
              <Label>Alert Type *</Label>
              <Select
                value={newAlert.alertType}
                onValueChange={(v) =>
                  setNewAlert((prev) => ({
                    ...prev,
                    alertType: (v ?? "SyncFailure") as AlertType,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TYPE_OPTIONS.filter((o) => o.value !== "all").map(
                    (opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label>Source *</Label>
              <Select
                value={newAlert.source}
                onValueChange={(v) =>
                  setNewAlert((prev) => ({
                    ...prev,
                    source: (v ?? "System") as Source,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.filter((o) => o.value !== "all").map(
                    (opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={newAlert.severity}
                onValueChange={(v) =>
                  setNewAlert((prev) => ({
                    ...prev,
                    severity: (v ?? "Warning") as Severity,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.filter((o) => o.value !== "all").map(
                    (opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="alert-title">Title *</Label>
              <Input
                id="alert-title"
                placeholder="Alert title"
                value={newAlert.title}
                onChange={(e) =>
                  setNewAlert((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="alert-description">Description *</Label>
              <Textarea
                id="alert-description"
                placeholder="Describe the alert..."
                value={newAlert.description}
                onChange={(e) =>
                  setNewAlert((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={newAlert.country || "none"}
                onValueChange={(v) =>
                  setNewAlert((prev) => ({
                    ...prev,
                    country: v === "none" ? "" : (v ?? ""),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {COUNTRY_OPTIONS.filter((o) => o.value !== "all").map(
                    (opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Metric Name */}
            <div className="space-y-2">
              <Label htmlFor="metric-name">Metric Name</Label>
              <Input
                id="metric-name"
                placeholder="e.g. syncSuccessRate"
                value={newAlert.metricName}
                onChange={(e) =>
                  setNewAlert((prev) => ({
                    ...prev,
                    metricName: e.target.value,
                  }))
                }
              />
            </div>

            {/* Metric Value + Threshold */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="metric-value">Current Value</Label>
                <Input
                  id="metric-value"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 45.2"
                  value={newAlert.metricValue}
                  onChange={(e) =>
                    setNewAlert((prev) => ({
                      ...prev,
                      metricValue: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold-value">Threshold</Label>
                <Input
                  id="threshold-value"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 95.0"
                  value={newAlert.thresholdValue}
                  onChange={(e) =>
                    setNewAlert((prev) => ({
                      ...prev,
                      thresholdValue: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Affected Entities */}
            <div className="space-y-2">
              <Label htmlFor="affected-entities">Affected Entities</Label>
              <Input
                id="affected-entities"
                placeholder="Comma-separated IDs, e.g. lender-001, lender-002"
                value={newAlert.affectedEntities}
                onChange={(e) =>
                  setNewAlert((prev) => ({
                    ...prev,
                    affectedEntities: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAlert}
              disabled={
                !newAlert.title.trim() || !newAlert.description.trim()
              }
            >
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
