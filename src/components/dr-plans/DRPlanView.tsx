"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Shield,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DRPlanType =
  | "FullFailover"
  | "PartialFailover"
  | "DataRecovery"
  | "ServiceRecovery";

interface DRPlan {
  id: string;
  country: string;
  planType: string;
  status: string;
  rtoMinutes: number;
  rpoMinutes: number;
  currentRtoMinutes: number | null;
  currentRpoMinutes: number | null;
  primarySite: string | null;
  drSite: string | null;
  failoverProcedure: string | null;
  failbackProcedure: string | null;
  dependencies: string | null;
  communicationPlan: string | null;
  lastDrillDate: string | null;
  nextDrillDate: string | null;
  drillFrequencyDays: number;
  approvedBy: string | null;
  approvedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DRPlansResponse {
  data: DRPlan[];
  pagination: Pagination;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COUNTRIES = [
  "Kenya",
  "Uganda",
  "Tanzania",
  "Ethiopia",
  "Nigeria",
  "Global",
];

const COUNTRY_FLAGS: Record<string, string> = {
  Kenya: "\u{1F1F0}\u{1F1EA}",
  Uganda: "\u{1F1FA}\u{1F1EC}",
  Tanzania: "\u{1F1F9}\u{1F1FF}",
  Ethiopia: "\u{1F1EA}\u{1F1F9}",
  Nigeria: "\u{1F1F3}\u{1F1EC}",
  Global: "\u{1F30D}",
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Approved", label: "Approved" },
  { value: "Active", label: "Active" },
  { value: "UnderReview", label: "Under Review" },
  { value: "Deprecated", label: "Deprecated" },
];

const PLAN_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "FullFailover", label: "Full Failover" },
  { value: "PartialFailover", label: "Partial Failover" },
  { value: "DataRecovery", label: "Data Recovery" },
  { value: "ServiceRecovery", label: "Service Recovery" },
];

const COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Countries" },
  ...COUNTRIES.map((c) => ({ value: c, label: c })),
];

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-800",
  Approved: "bg-green-100 text-green-800",
  Active: "bg-emerald-100 text-emerald-800",
  UnderReview: "bg-amber-100 text-amber-800",
  Deprecated: "bg-red-100 text-red-800",
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  FullFailover: "Full Failover",
  PartialFailover: "Partial Failover",
  DataRecovery: "Data Recovery",
  ServiceRecovery: "Service Recovery",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  Draft: Clock,
  Approved: CheckCircle,
  Active: Play,
  UnderReview: RotateCcw,
  Deprecated: AlertTriangle,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Parse a JSON string that may contain an array of step objects or strings. */
function parseProcedureSteps(jsonStr: string | null): { title?: string; description?: string }[] | null {
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    // Not valid JSON — treat as plain text
    return null;
  }
}

function parseDependencies(jsonStr: string | null): string[] | null {
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed.map(String);
    return null;
  } catch {
    return null;
  }
}

function rtoRpoColor(
  target: number,
  actual: number | null
): "text-green-600" | "text-red-600" | "text-gray-500" {
  if (actual === null || actual === undefined) return "text-gray-500";
  if (actual <= target) return "text-green-600";
  return "text-red-600";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DRPlanView() {
  // ── State ──
  const [plans, setPlans] = useState<DRPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlanType, setFilterPlanType] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [drillDialogOpen, setDrillDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<DRPlan | null>(null);

  // Create form
  const [formCountry, setFormCountry] = useState("Kenya");
  const [formPlanType, setFormPlanType] = useState<DRPlanType>("FullFailover");
  const [formRto, setFormRto] = useState(240);
  const [formRpo, setFormRpo] = useState(60);
  const [formPrimarySite, setFormPrimarySite] = useState("");
  const [formDrSite, setFormDrSite] = useState("");
  const [formDrillFreq, setFormDrillFreq] = useState(90);
  const [formFailoverProc, setFormFailoverProc] = useState("");
  const [formFailbackProc, setFormFailbackProc] = useState("");
  const [formDependencies, setFormDependencies] = useState("");
  const [formCommsPlan, setFormCommsPlan] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Action form
  const [actionType, setActionType] = useState<"approve" | "activate" | "review" | "deprecate">("approve");
  const [actionBy, setActionBy] = useState("");

  // Drill form
  const [drillRto, setDrillRto] = useState("");
  const [drillRpo, setDrillRpo] = useState("");

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──
  // Initial fetch and refetch when deps change — use .then() pattern to
  // avoid the "setState synchronously within an effect" lint error.
  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (filterCountry !== "all") params.set("country", filterCountry);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterPlanType !== "all") params.set("planType", filterPlanType);

    fetch(`/api/dr-plans?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch DR plans");
        return res.json();
      })
      .then((json: DRPlansResponse) => {
        setPlans(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [page, filterCountry, filterStatus, filterPlanType]);

  // Reset page when filters change
  const handleFilterCountryChange = useCallback(
    (v: string | null) => {
      setFilterCountry(v ?? "all");
      setPage(1);
    },
    []
  );

  const handleFilterStatusChange = useCallback(
    (v: string | null) => {
      setFilterStatus(v ?? "all");
      setPage(1);
    },
    []
  );

  const handleFilterPlanTypeChange = useCallback(
    (v: string | null) => {
      setFilterPlanType(v ?? "all");
      setPage(1);
    },
    []
  );

  // Manual refresh after actions
  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (filterCountry !== "all") params.set("country", filterCountry);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterPlanType !== "all") params.set("planType", filterPlanType);

      const res = await fetch(`/api/dr-plans?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch DR plans");
      const json: DRPlansResponse = await res.json();
      setPlans(json.data);
      setTotalPages(json.pagination.totalPages);
      setTotal(json.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, filterCountry, filterStatus, filterPlanType]);

  // ── Handlers ──

  const resetCreateForm = useCallback(() => {
    setFormCountry("Kenya");
    setFormPlanType("FullFailover");
    setFormRto(240);
    setFormRpo(60);
    setFormPrimarySite("");
    setFormDrSite("");
    setFormDrillFreq(90);
    setFormFailoverProc("");
    setFormFailbackProc("");
    setFormDependencies("");
    setFormCommsPlan("");
    setFormNotes("");
  }, []);

  const handleCreate = useCallback(async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        country: formCountry,
        planType: formPlanType,
        rtoMinutes: formRto,
        rpoMinutes: formRpo,
        drillFrequencyDays: formDrillFreq,
      };
      if (formPrimarySite) body.primarySite = formPrimarySite;
      if (formDrSite) body.drSite = formDrSite;
      if (formFailoverProc) body.failoverProcedure = formFailoverProc;
      if (formFailbackProc) body.failbackProcedure = formFailbackProc;
      if (formDependencies) body.dependencies = formDependencies;
      if (formCommsPlan) body.communicationPlan = formCommsPlan;
      if (formNotes) body.notes = formNotes;

      const res = await fetch("/api/dr-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error ?? "Failed to create DR plan");
      }
      setCreateDialogOpen(false);
      resetCreateForm();
      refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create DR plan");
    } finally {
      setSubmitting(false);
    }
  }, [
    formCountry,
    formPlanType,
    formRto,
    formRpo,
    formDrillFreq,
    formPrimarySite,
    formDrSite,
    formFailoverProc,
    formFailbackProc,
    formDependencies,
    formCommsPlan,
    formNotes,
    resetCreateForm,
    refreshPlans,
  ]);

  const handleAction = useCallback(async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { action: actionType };
      if (actionType === "approve") body.approvedBy = actionBy || "Admin";
      if (actionType === "review") body.reviewedBy = actionBy || "Admin";

      const res = await fetch(`/api/dr-plans/${selectedPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error ?? "Failed to update DR plan");
      }
      setActionDialogOpen(false);
      setActionBy("");
      refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update DR plan");
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlan, actionType, actionBy, refreshPlans]);

  const handleRecordDrill = useCallback(async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { action: "recordDrill" };
      if (drillRto) body.currentRtoMinutes = Number(drillRto);
      if (drillRpo) body.currentRpoMinutes = Number(drillRpo);

      const res = await fetch(`/api/dr-plans/${selectedPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error ?? "Failed to record drill");
      }
      setDrillDialogOpen(false);
      setDrillRto("");
      setDrillRpo("");
      refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record drill");
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlan, drillRto, drillRpo, refreshPlans]);

  // ── Available actions for a given status ──
  function getAvailableActions(status: string) {
    switch (status) {
      case "Draft":
        return [
          { action: "approve" as const, label: "Approve", icon: CheckCircle },
          { action: "review" as const, label: "Review", icon: RotateCcw },
        ];
      case "Approved":
        return [
          { action: "activate" as const, label: "Activate", icon: Play },
          { action: "review" as const, label: "Review", icon: RotateCcw },
          { action: "deprecate" as const, label: "Deprecate", icon: AlertTriangle },
        ];
      case "Active":
        return [
          { action: "review" as const, label: "Review", icon: RotateCcw },
          { action: "deprecate" as const, label: "Deprecate", icon: AlertTriangle },
        ];
      case "UnderReview":
        return [
          { action: "approve" as const, label: "Approve", icon: CheckCircle },
          { action: "deprecate" as const, label: "Deprecate", icon: AlertTriangle },
        ];
      case "Deprecated":
        return [];
      default:
        return [];
    }
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Disaster Recovery Plans</h2>
            <p className="text-sm text-muted-foreground">
              {total} plan{total !== 1 ? "s" : ""} configured
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetCreateForm();
            setCreateDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New DR Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterCountry}
          onValueChange={handleFilterCountryChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.value !== "all" && COUNTRY_FLAGS[o.value]
                  ? `${COUNTRY_FLAGS[o.value]} `
                  : ""}
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterStatus}
          onValueChange={handleFilterStatusChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterPlanType}
          onValueChange={handleFilterPlanTypeChange}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Plan Type" />
          </SelectTrigger>
          <SelectContent>
            {PLAN_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-red-600"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && plans.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No DR plans found</p>
            <p className="text-sm mt-1">
              Create a new Disaster Recovery plan to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      {!loading && plans.length > 0 && (
        <div className="grid gap-4">
          {plans.map((plan) => {
            const StatusIcon = STATUS_ICONS[plan.status] ?? Clock;
            const actions = getAvailableActions(plan.status);

            return (
              <Card
                key={plan.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 md:p-6">
                  {/* Top row: Title & badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {COUNTRY_FLAGS[plan.country] ?? "\u{1F30D}"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">
                            {plan.country} &mdash;{" "}
                            {PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}
                          </h3>
                          <Badge
                            className={cn(
                              "gap-1 text-xs",
                              STATUS_COLORS[plan.status] ??
                                "bg-gray-100 text-gray-800"
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {plan.status === "UnderReview"
                              ? "Under Review"
                              : plan.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {plan.primarySite && plan.drSite
                            ? `${plan.primarySite} \u2192 ${plan.drSite}`
                            : "Sites not configured"}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {actions.map((a) => (
                        <Button
                          key={a.action}
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setActionType(a.action);
                            setActionBy("");
                            setActionDialogOpen(true);
                          }}
                        >
                          <a.icon className="h-3.5 w-3.5" />
                          {a.label}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setDrillRto("");
                          setDrillRpo("");
                          setDrillDialogOpen(true);
                        }}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Record Drill
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setDetailDialogOpen(true);
                        }}
                      >
                        View Detail
                      </Button>
                    </div>
                  </div>

                  {/* RTO / RPO comparison */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {/* RTO Target */}
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        RTO Target
                      </p>
                      <p className="text-lg font-semibold">
                        {plan.rtoMinutes}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          min
                        </span>
                      </p>
                    </div>
                    {/* RTO Actual */}
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        RTO Actual
                      </p>
                      <p
                        className={cn(
                          "text-lg font-semibold",
                          rtoRpoColor(plan.rtoMinutes, plan.currentRtoMinutes)
                        )}
                      >
                        {plan.currentRtoMinutes !== null &&
                        plan.currentRtoMinutes !== undefined
                          ? plan.currentRtoMinutes
                          : "—"}{" "}
                        {plan.currentRtoMinutes !== null &&
                          plan.currentRtoMinutes !== undefined && (
                            <span className="text-xs font-normal">
                              min
                            </span>
                          )}
                      </p>
                    </div>
                    {/* RPO Target */}
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        RPO Target
                      </p>
                      <p className="text-lg font-semibold">
                        {plan.rpoMinutes}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          min
                        </span>
                      </p>
                    </div>
                    {/* RPO Actual */}
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        RPO Actual
                      </p>
                      <p
                        className={cn(
                          "text-lg font-semibold",
                          rtoRpoColor(plan.rpoMinutes, plan.currentRpoMinutes)
                        )}
                      >
                        {plan.currentRpoMinutes !== null &&
                        plan.currentRpoMinutes !== undefined
                          ? plan.currentRpoMinutes
                          : "—"}{" "}
                        {plan.currentRpoMinutes !== null &&
                          plan.currentRpoMinutes !== undefined && (
                            <span className="text-xs font-normal">
                              min
                            </span>
                          )}
                      </p>
                    </div>
                  </div>

                  {/* RTO/RPO status indicator */}
                  {(plan.currentRtoMinutes !== null ||
                    plan.currentRpoMinutes !== null) && (
                    <div className="flex items-center gap-4 mb-4 text-xs">
                      {plan.currentRtoMinutes !== null && (
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            plan.currentRtoMinutes <= plan.rtoMinutes
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {plan.currentRtoMinutes <= plan.rtoMinutes ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          RTO{" "}
                          {plan.currentRtoMinutes <= plan.rtoMinutes
                            ? "within target"
                            : "exceeds target"}
                        </span>
                      )}
                      {plan.currentRpoMinutes !== null && (
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            plan.currentRpoMinutes <= plan.rpoMinutes
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {plan.currentRpoMinutes <= plan.rpoMinutes ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          RPO{" "}
                          {plan.currentRpoMinutes <= plan.rpoMinutes
                            ? "within target"
                            : "exceeds target"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom metadata row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Last drill: {formatDate(plan.lastDrillDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Next drill: {formatDate(plan.nextDrillDate)}
                    </span>
                    <span>
                      Drill frequency: every {plan.drillFrequencyDays} days
                    </span>
                    {plan.approvedBy && (
                      <span>
                        Approved by: {plan.approvedBy}{" "}
                        {formatDate(plan.approvedAt)}
                      </span>
                    )}
                    {plan.reviewedBy && (
                      <span>
                        Reviewed by: {plan.reviewedBy}{" "}
                        {formatDate(plan.reviewedAt)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Create DR Plan Dialog */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Create DR Plan
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select
                  value={formCountry}
                  onValueChange={(v) => setFormCountry(v ?? "Kenya")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {COUNTRY_FLAGS[c]} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan Type */}
              <div className="space-y-2">
                <Label>Plan Type *</Label>
                <Select
                  value={formPlanType}
                  onValueChange={(v) =>
                    setFormPlanType((v ?? "FullFailover") as DRPlanType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FullFailover">Full Failover</SelectItem>
                    <SelectItem value="PartialFailover">
                      Partial Failover
                    </SelectItem>
                    <SelectItem value="DataRecovery">
                      Data Recovery
                    </SelectItem>
                    <SelectItem value="ServiceRecovery">
                      Service Recovery
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* RTO / RPO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>RTO (minutes)</Label>
                <Input
                  type="number"
                  value={formRto}
                  onChange={(e) =>
                    setFormRto(Number(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>RPO (minutes)</Label>
                <Input
                  type="number"
                  value={formRpo}
                  onChange={(e) =>
                    setFormRpo(Number(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Drill Frequency (days)</Label>
                <Input
                  type="number"
                  value={formDrillFreq}
                  onChange={(e) =>
                    setFormDrillFreq(Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            {/* Sites */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Site</Label>
                <Input
                  value={formPrimarySite}
                  onChange={(e) => setFormPrimarySite(e.target.value)}
                  placeholder="e.g. Nairobi DC"
                />
              </div>
              <div className="space-y-2">
                <Label>DR Site</Label>
                <Input
                  value={formDrSite}
                  onChange={(e) => setFormDrSite(e.target.value)}
                  placeholder="e.g. Mombasa DC"
                />
              </div>
            </div>

            {/* Failover Procedure */}
            <div className="space-y-2">
              <Label>Failover Procedure (JSON steps or text)</Label>
              <Textarea
                value={formFailoverProc}
                onChange={(e) => setFormFailoverProc(e.target.value)}
                placeholder='[{"title":"Step 1","description":"Activate DR site"}] or plain text'
                rows={3}
              />
            </div>

            {/* Failback Procedure */}
            <div className="space-y-2">
              <Label>Failback Procedure (JSON steps or text)</Label>
              <Textarea
                value={formFailbackProc}
                onChange={(e) => setFormFailbackProc(e.target.value)}
                placeholder='[{"title":"Step 1","description":"Verify primary site readiness"}] or plain text'
                rows={3}
              />
            </div>

            {/* Dependencies */}
            <div className="space-y-2">
              <Label>Dependencies (JSON array or comma-separated)</Label>
              <Input
                value={formDependencies}
                onChange={(e) => setFormDependencies(e.target.value)}
                placeholder='["Salesforce","Database","DNS"] or Salesforce, Database, DNS'
              />
            </div>

            {/* Communication Plan */}
            <div className="space-y-2">
              <Label>Communication Plan</Label>
              <Textarea
                value={formCommsPlan}
                onChange={(e) => setFormCommsPlan(e.target.value)}
                placeholder="Stakeholder notification steps..."
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* View Detail Dialog */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              DR Plan Detail
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-5 py-4">
              {/* Overview */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl">
                  {COUNTRY_FLAGS[selectedPlan.country] ?? "\u{1F30D}"}
                </span>
                <h3 className="font-semibold text-lg">
                  {selectedPlan.country} &mdash;{" "}
                  {PLAN_TYPE_LABELS[selectedPlan.planType] ??
                    selectedPlan.planType}
                </h3>
                <Badge
                  className={cn(
                    "gap-1",
                    STATUS_COLORS[selectedPlan.status] ??
                      "bg-gray-100 text-gray-800"
                  )}
                >
                  {selectedPlan.status === "UnderReview"
                    ? "Under Review"
                    : selectedPlan.status}
                </Badge>
              </div>

              {/* Sites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Primary Site
                  </p>
                  <p className="font-medium">
                    {selectedPlan.primarySite ?? "Not configured"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    DR Site
                  </p>
                  <p className="font-medium">
                    {selectedPlan.drSite ?? "Not configured"}
                  </p>
                </div>
              </div>

              {/* RTO / RPO comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    RTO Target
                  </p>
                  <p className="text-lg font-semibold">
                    {selectedPlan.rtoMinutes} min
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    RTO Actual
                  </p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      rtoRpoColor(
                        selectedPlan.rtoMinutes,
                        selectedPlan.currentRtoMinutes
                      )
                    )}
                  >
                    {selectedPlan.currentRtoMinutes ?? "—"}{" "}
                    {selectedPlan.currentRtoMinutes !== null && "min"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    RPO Target
                  </p>
                  <p className="text-lg font-semibold">
                    {selectedPlan.rpoMinutes} min
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    RPO Actual
                  </p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      rtoRpoColor(
                        selectedPlan.rpoMinutes,
                        selectedPlan.currentRpoMinutes
                      )
                    )}
                  >
                    {selectedPlan.currentRpoMinutes ?? "—"}{" "}
                    {selectedPlan.currentRpoMinutes !== null && "min"}
                  </p>
                </div>
              </div>

              {/* Drill info */}
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium text-sm">Drill Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Last Drill:</span>{" "}
                    {formatDate(selectedPlan.lastDrillDate)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next Drill:</span>{" "}
                    {formatDate(selectedPlan.nextDrillDate)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>{" "}
                    Every {selectedPlan.drillFrequencyDays} days
                  </div>
                </div>
              </div>

              {/* Failover Procedure */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Play className="h-4 w-4 text-emerald-600" />
                  Failover Procedure
                </h4>
                {(() => {
                  const steps = parseProcedureSteps(
                    selectedPlan.failoverProcedure
                  );
                  if (steps) {
                    return (
                      <ol className="space-y-2">
                        {steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium">
                                {step.title ?? `Step ${i + 1}`}
                              </p>
                              {step.description && (
                                <p className="text-muted-foreground">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  if (selectedPlan.failoverProcedure) {
                    return (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedPlan.failoverProcedure}
                      </p>
                    );
                  }
                  return (
                    <p className="text-sm text-muted-foreground italic">
                      No failover procedure documented.
                    </p>
                  );
                })()}
              </div>

              {/* Failback Procedure */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                  Failback Procedure
                </h4>
                {(() => {
                  const steps = parseProcedureSteps(
                    selectedPlan.failbackProcedure
                  );
                  if (steps) {
                    return (
                      <ol className="space-y-2">
                        {steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-semibold">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium">
                                {step.title ?? `Step ${i + 1}`}
                              </p>
                              {step.description && (
                                <p className="text-muted-foreground">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  if (selectedPlan.failbackProcedure) {
                    return (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedPlan.failbackProcedure}
                      </p>
                    );
                  }
                  return (
                    <p className="text-sm text-muted-foreground italic">
                      No failback procedure documented.
                    </p>
                  );
                })()}
              </div>

              {/* Dependencies */}
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium text-sm">Dependencies</h4>
                {(() => {
                  const deps = parseDependencies(selectedPlan.dependencies);
                  if (deps && deps.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-2">
                        {deps.map((dep, i) => (
                          <Badge key={i} variant="outline">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    );
                  }
                  if (selectedPlan.dependencies) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.dependencies}
                      </p>
                    );
                  }
                  return (
                    <p className="text-sm text-muted-foreground italic">
                      No dependencies documented.
                    </p>
                  );
                })()}
              </div>

              {/* Communication Plan */}
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium text-sm">Communication Plan</h4>
                {(() => {
                  const steps = parseProcedureSteps(
                    selectedPlan.communicationPlan
                  );
                  if (steps) {
                    return (
                      <ol className="space-y-2">
                        {steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium">
                                {step.title ?? `Step ${i + 1}`}
                              </p>
                              {step.description && (
                                <p className="text-muted-foreground">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  if (selectedPlan.communicationPlan) {
                    return (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedPlan.communicationPlan}
                      </p>
                    );
                  }
                  return (
                    <p className="text-sm text-muted-foreground italic">
                      No communication plan documented.
                    </p>
                  );
                })()}
              </div>

              {/* Approval & Review */}
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium text-sm">Approval &amp; Review</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Approved by:</span>{" "}
                    {selectedPlan.approvedBy ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Approved at:
                    </span>{" "}
                    {formatDateTime(selectedPlan.approvedAt)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reviewed by:</span>{" "}
                    {selectedPlan.reviewedBy ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Reviewed at:
                    </span>{" "}
                    {formatDateTime(selectedPlan.reviewedAt)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPlan.notes && (
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="font-medium text-sm">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedPlan.notes}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground flex gap-4">
                <span>Created: {formatDateTime(selectedPlan.createdAt)}</span>
                <span>Updated: {formatDateTime(selectedPlan.updatedAt)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Action Dialog (Approve / Activate / Review / Deprecate) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve DR Plan"}
              {actionType === "activate" && "Activate DR Plan"}
              {actionType === "review" && "Send for Review"}
              {actionType === "deprecate" && "Deprecate DR Plan"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedPlan && (
              <p className="text-sm text-muted-foreground">
                {selectedPlan.country} &mdash;{" "}
                {PLAN_TYPE_LABELS[selectedPlan.planType] ??
                  selectedPlan.planType}
              </p>
            )}

            {(actionType === "approve" || actionType === "review") && (
              <div className="space-y-2">
                <Label>
                  {actionType === "approve"
                    ? "Approved By"
                    : "Reviewed By"}
                </Label>
                <Input
                  value={actionBy}
                  onChange={(e) => setActionBy(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
            )}

            {actionType === "deprecate" && (
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                This plan will be marked as deprecated and should not be used
                for future drills.
              </p>
            )}

            {actionType === "activate" && (
              <p className="text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                This plan will be activated and become the current DR plan for
                this country/type.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={submitting}
              variant={actionType === "deprecate" ? "destructive" : "default"}
            >
              {submitting
                ? "Processing..."
                : actionType === "approve"
                  ? "Approve"
                  : actionType === "activate"
                    ? "Activate"
                    : actionType === "review"
                      ? "Send for Review"
                      : "Deprecate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Record Drill Dialog */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={drillDialogOpen} onOpenChange={setDrillDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-600" />
              Record Drill Results
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedPlan && (
              <div className="text-sm text-muted-foreground">
                <p>
                  {selectedPlan.country} &mdash;{" "}
                  {PLAN_TYPE_LABELS[selectedPlan.planType] ??
                    selectedPlan.planType}
                </p>
                <p className="mt-1">
                  Current targets: RTO {selectedPlan.rtoMinutes} min / RPO{" "}
                  {selectedPlan.rpoMinutes} min
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Measured RTO (minutes)</Label>
                <Input
                  type="number"
                  value={drillRto}
                  onChange={(e) => setDrillRto(e.target.value)}
                  placeholder={selectedPlan?.rtoMinutes.toString() ?? "240"}
                />
              </div>
              <div className="space-y-2">
                <Label>Measured RPO (minutes)</Label>
                <Input
                  type="number"
                  value={drillRpo}
                  onChange={(e) => setDrillRpo(e.target.value)}
                  placeholder={selectedPlan?.rpoMinutes.toString() ?? "60"}
                />
              </div>
            </div>

            {drillRto && selectedPlan && (
              <p
                className={cn(
                  "text-xs flex items-center gap-1",
                  Number(drillRto) <= selectedPlan.rtoMinutes
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {Number(drillRto) <= selectedPlan.rtoMinutes ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                RTO{" "}
                {Number(drillRto) <= selectedPlan.rtoMinutes
                  ? "within target"
                  : "exceeds target"}{" "}
                ({selectedPlan.rtoMinutes} min)
              </p>
            )}

            {drillRpo && selectedPlan && (
              <p
                className={cn(
                  "text-xs flex items-center gap-1",
                  Number(drillRpo) <= selectedPlan.rpoMinutes
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {Number(drillRpo) <= selectedPlan.rpoMinutes ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                RPO{" "}
                {Number(drillRpo) <= selectedPlan.rpoMinutes
                  ? "within target"
                  : "exceeds target"}{" "}
                ({selectedPlan.rpoMinutes} min)
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Recording a drill will update the last drill date to now and
              calculate the next drill date based on frequency.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDrillDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordDrill} disabled={submitting}>
              {submitting ? "Recording..." : "Record Drill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
