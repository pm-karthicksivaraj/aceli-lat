"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { AlertTriangle, Plus, Eye, Wrench, Clock, CheckCircle, AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type KnownIssueStatus = "Open" | "Investigating" | "WorkaroundAvailable" | "FixPlanned" | "Fixed" | "Closed" | "Deferred";
type KnownIssueSeverity = "Low" | "Medium" | "High" | "Critical";
type KnownIssueCategory = "Functional" | "Performance" | "Security" | "DataIntegrity" | "UX" | "Integration" | "Offline" | "Sync";
type KnownIssueImpact = "Low" | "Medium" | "High" | "Widespread";
type Country = "Kenya" | "Uganda" | "Tanzania" | "Ethiopia" | "Nigeria";

interface KnownIssue {
  id: string;
  issueNumber: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category: string;
  country: string | null;
  affectedVersion: string | null;
  fixedVersion: string | null;
  workaround: string | null;
  reportedBy: string;
  reportedAt: string;
  assignedTo: string | null;
  impact: string;
  occurrenceCount: number;
  relatedDefectId: string | null;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];
const STATUSES: KnownIssueStatus[] = ["Open", "Investigating", "WorkaroundAvailable", "FixPlanned", "Fixed", "Closed", "Deferred"];
const SEVERITIES: KnownIssueSeverity[] = ["Low", "Medium", "High", "Critical"];
const CATEGORIES: KnownIssueCategory[] = ["Functional", "Performance", "Security", "DataIntegrity", "UX", "Integration", "Offline", "Sync"];
const IMPACTS: KnownIssueImpact[] = ["Low", "Medium", "High", "Widespread"];

const COUNTRY_FLAGS: Record<string, string> = {
  Kenya: "KE",
  Uganda: "UG",
  Tanzania: "TZ",
  Ethiopia: "ET",
  Nigeria: "NG",
};

const SEVERITY_COLORS: Record<KnownIssueSeverity, string> = {
  Low: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Medium: "bg-amber-100 text-amber-800 border-amber-300",
  High: "bg-orange-100 text-orange-800 border-orange-300",
  Critical: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_COLORS: Record<KnownIssueStatus, string> = {
  Open: "bg-gray-100 text-gray-800 border-gray-300",
  Investigating: "bg-blue-100 text-blue-800 border-blue-300",
  WorkaroundAvailable: "bg-amber-100 text-amber-800 border-amber-300",
  FixPlanned: "bg-purple-100 text-purple-800 border-purple-300",
  Fixed: "bg-green-100 text-green-800 border-green-300",
  Closed: "bg-gray-200 text-gray-600 border-gray-400",
  Deferred: "bg-slate-100 text-slate-600 border-slate-300",
};

const STATUS_ICONS: Record<KnownIssueStatus, React.ElementType> = {
  Open: AlertCircle,
  Investigating: AlertTriangle,
  WorkaroundAvailable: Wrench,
  FixPlanned: Clock,
  Fixed: CheckCircle,
  Closed: CheckCircle,
  Deferred: Clock,
};

const IMPACT_COLORS: Record<KnownIssueImpact, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-orange-100 text-orange-800",
  Widespread: "bg-red-100 text-red-800",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function KnownIssuesRegister() {
  // Data state
  const [issues, setIssues] = useState<KnownIssue[]>([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  // Selected issue for view/action
  const [selectedIssue, setSelectedIssue] = useState<KnownIssue | null>(null);

  // Action dialog type
  const [actionType, setActionType] = useState<"investigate" | "workaround" | "planFix" | "fix" | "close" | "defer">("investigate");

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    severity: "Medium" as string,
    category: "Functional" as string,
    country: "" as string,
    affectedVersion: "",
    reportedBy: "",
    assignedTo: "",
    impact: "Medium" as string,
    relatedDefectId: "",
    workaround: "",
    notes: "",
  });

  // Action form state
  const [actionForm, setActionForm] = useState({
    assignedTo: "",
    workaround: "",
    fixedVersion: "",
    resolvedBy: "",
    resolution: "",
    notes: "",
  });

  // Saving state
  const [saving, setSaving] = useState(false);

  // ─── Fetch Issues ────────────────────────────────────────────────────────

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterCountry && filterCountry !== "all") params.set("country", filterCountry);
      if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);
      if (filterSeverity && filterSeverity !== "all") params.set("severity", filterSeverity);
      if (filterCategory && filterCategory !== "all") params.set("category", filterCategory);
      params.set("pageSize", "100");

      const res = await fetch(`/api/known-issues?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch known issues");
      const json = await res.json();
      setIssues(json.data ?? []);
      setTotalIssues(json.pagination?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [filterCountry, filterStatus, filterSeverity, filterCategory]);

  useEffect(() => {
    const controller = new AbortController();
    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filterCountry && filterCountry !== "all") params.set("country", filterCountry);
        if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);
        if (filterSeverity && filterSeverity !== "all") params.set("severity", filterSeverity);
        if (filterCategory && filterCategory !== "all") params.set("category", filterCategory);
        params.set("pageSize", "100");

        const res = await fetch(`/api/known-issues?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch known issues");
        const json = await res.json();
        setIssues(json.data ?? []);
        setTotalIssues(json.pagination?.total ?? 0);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    doFetch();
    return () => controller.abort();
  }, [filterCountry, filterStatus, filterSeverity, filterCategory]);

  // ─── Create Issue ────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createForm.title || !createForm.description || !createForm.category || !createForm.reportedBy) {
      setError("Title, description, category, and reported by are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/known-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          severity: createForm.severity,
          category: createForm.category,
          country: createForm.country || null,
          affectedVersion: createForm.affectedVersion || null,
          reportedBy: createForm.reportedBy,
          assignedTo: createForm.assignedTo || null,
          impact: createForm.impact,
          relatedDefectId: createForm.relatedDefectId || null,
          workaround: createForm.workaround || null,
          notes: createForm.notes || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create known issue");
      }
      setCreateDialogOpen(false);
      resetCreateForm();
      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create known issue");
    } finally {
      setSaving(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      severity: "Medium",
      category: "Functional",
      country: "",
      affectedVersion: "",
      reportedBy: "",
      assignedTo: "",
      impact: "Medium",
      relatedDefectId: "",
      workaround: "",
      notes: "",
    });
  };

  // ─── Action Handler ──────────────────────────────────────────────────────

  const handleAction = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { action: actionType };

      switch (actionType) {
        case "investigate":
          if (actionForm.assignedTo) body.assignedTo = actionForm.assignedTo;
          break;
        case "workaround":
          body.workaround = actionForm.workaround;
          break;
        case "planFix":
          if (actionForm.fixedVersion) body.fixedVersion = actionForm.fixedVersion;
          break;
        case "fix":
          if (actionForm.resolvedBy) body.resolvedBy = actionForm.resolvedBy;
          if (actionForm.resolution) body.resolution = actionForm.resolution;
          if (actionForm.fixedVersion) body.fixedVersion = actionForm.fixedVersion;
          break;
        case "close":
          break;
        case "defer":
          if (actionForm.notes) body.notes = actionForm.notes;
          break;
      }

      const res = await fetch(`/api/known-issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update known issue");
      }
      setActionDialogOpen(false);
      setSelectedIssue(null);
      setActionForm({ assignedTo: "", workaround: "", fixedVersion: "", resolvedBy: "", resolution: "", notes: "" });
      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update known issue");
    } finally {
      setSaving(false);
    }
  };

  // ─── Increment Occurrence ────────────────────────────────────────────────

  const handleIncrementOccurrence = async (issue: KnownIssue) => {
    try {
      const res = await fetch(`/api/known-issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "incrementOccurrence" }),
      });
      if (!res.ok) throw new Error("Failed to increment occurrence");
      await fetchIssues();
    } catch {
      // Silent fail for quick action
    }
  };

  // ─── Open Action Dialog ──────────────────────────────────────────────────

  const openActionDialog = (issue: KnownIssue, action: typeof actionType) => {
    setSelectedIssue(issue);
    setActionType(action);
    setActionForm({
      assignedTo: issue.assignedTo ?? "",
      workaround: issue.workaround ?? "",
      fixedVersion: issue.fixedVersion ?? "",
      resolvedBy: issue.resolvedBy ?? "",
      resolution: issue.resolution ?? "",
      notes: issue.notes ?? "",
    });
    setActionDialogOpen(true);
  };

  // ─── Open View Dialog ────────────────────────────────────────────────────

  const openViewDialog = (issue: KnownIssue) => {
    setSelectedIssue(issue);
    setViewDialogOpen(true);
  };

  // ─── Available Actions ───────────────────────────────────────────────────

  const getAvailableActions = (status: string): { action: typeof actionType; label: string; icon: React.ElementType }[] => {
    const actions: { action: typeof actionType; label: string; icon: React.ElementType }[] = [];
    switch (status) {
      case "Open":
        actions.push({ action: "investigate", label: "Investigate", icon: AlertTriangle });
        break;
      case "Investigating":
        actions.push({ action: "workaround", label: "Add Workaround", icon: Wrench });
        actions.push({ action: "planFix", label: "Plan Fix", icon: Clock });
        break;
      case "WorkaroundAvailable":
        actions.push({ action: "planFix", label: "Plan Fix", icon: Clock });
        break;
      case "FixPlanned":
        actions.push({ action: "fix", label: "Mark Fixed", icon: CheckCircle });
        break;
      case "Fixed":
        actions.push({ action: "close", label: "Close", icon: CheckCircle });
        break;
      default:
        break;
    }
    if (status !== "Closed" && status !== "Deferred") {
      actions.push({ action: "defer", label: "Defer", icon: Clock });
    }
    return actions;
  };

  // ─── Stats ───────────────────────────────────────────────────────────────

  const openCount = issues.filter((i) => i.status === "Open").length;
  const criticalCount = issues.filter((i) => i.severity === "Critical" && i.status !== "Closed" && i.status !== "Deferred").length;
  const workaroundCount = issues.filter((i) => i.status === "WorkaroundAvailable").length;
  const fixedCount = issues.filter((i) => i.status === "Fixed" || i.status === "Closed").length;

  // ─── Format Date ─────────────────────────────────────────────────────────

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Known Issues Register
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalIssues} issue{totalIssues !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Known Issue
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{openCount}</p>
              <p className="text-[11px] text-muted-foreground">Open</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{criticalCount}</p>
              <p className="text-[11px] text-muted-foreground">Critical Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-amber-100 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{workaroundCount}</p>
              <p className="text-[11px] text-muted-foreground">Workaround</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{fixedCount}</p>
              <p className="text-[11px] text-muted-foreground">Resolved</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-[11px] mb-1 block">Country</Label>
              <Select value={filterCountry} onValueChange={(v) => setFilterCountry(v ?? "all")}>
                <SelectTrigger className="h-8 text-xs">
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
            <div>
              <Label className="text-[11px] mb-1 block">Status</Label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] mb-1 block">Severity</Label>
              <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v ?? "all")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] mb-1 block">Category</Label>
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 text-xs">Dismiss</Button>
        </div>
      )}

      {/* Issues Table / Card List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No known issues found matching your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
          {issues.map((issue) => {
            const StatusIcon = STATUS_ICONS[issue.status as KnownIssueStatus] ?? AlertCircle;
            const availableActions = getAvailableActions(issue.status);

            return (
              <Card
                key={issue.id}
                className={cn(
                  "hover:shadow-md transition-shadow",
                  issue.severity === "Critical" && issue.status !== "Closed" && issue.status !== "Deferred" && "border-l-4 border-l-red-500"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Issue number, title, severity */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
                        <span className="text-[10px] font-mono text-muted-foreground">Issue</span>
                        <span className="text-xs font-bold text-primary">{issue.issueNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm truncate">{issue.title}</h3>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0 h-5", SEVERITY_COLORS[issue.severity as KnownIssueSeverity] ?? "")}
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{issue.description}</p>
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0 h-5", STATUS_COLORS[issue.status as KnownIssueStatus] ?? "")}
                        >
                          {issue.status}
                        </Badge>
                      </span>
                      <span className="flex items-center gap-1">
                        {issue.country ? (
                          <>{COUNTRY_FLAGS[issue.country] ?? ""} {issue.country}</>
                        ) : (
                          "Global"
                        )}
                      </span>
                      <span>Category: {issue.category}</span>
                      <span>Impact: <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", IMPACT_COLORS[issue.impact as KnownIssueImpact] ?? "")}>{issue.impact}</Badge></span>
                      {issue.affectedVersion && <span>Affected: v{issue.affectedVersion}</span>}
                      {issue.fixedVersion && <span>Fixed: v{issue.fixedVersion}</span>}
                      {issue.workaround && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Wrench className="h-3 w-3" /> Workaround
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Occurrence, Assigned, Actions */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Occurrences:
                          <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{issue.occurrenceCount}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-xs"
                            onClick={() => handleIncrementOccurrence(issue)}
                            title="Increment occurrence"
                          >
                            +1
                          </Button>
                        </span>
                        {issue.assignedTo && (
                          <span>Assigned: {issue.assignedTo}</span>
                        )}
                        <span>Reported: {formatDate(issue.reportedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => openViewDialog(issue)}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        {availableActions.map((act) => {
                          const ActIcon = act.icon;
                          return (
                            <Button
                              key={act.action}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => openActionDialog(issue, act.action)}
                            >
                              <ActIcon className="h-3 w-3" />
                              <span className="hidden sm:inline">{act.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Create Known Issue Dialog ──────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Report New Known Issue
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="ki-title" className="text-xs">Title *</Label>
              <Input
                id="ki-title"
                placeholder="Brief description of the known issue"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="ki-desc" className="text-xs">Description *</Label>
              <Textarea
                id="ki-desc"
                placeholder="Detailed description of the issue, including symptoms and context"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                className="min-h-[80px] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Severity</Label>
                <Select value={createForm.severity} onValueChange={(v) => setCreateForm((f) => ({ ...f, severity: v ?? "Medium" }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category *</Label>
                <Select value={createForm.category} onValueChange={(v) => setCreateForm((f) => ({ ...f, category: v ?? "Functional" }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Country</Label>
                <Select value={createForm.country || "all"} onValueChange={(v) => setCreateForm((f) => ({ ...f, country: v === "all" || v === null ? "" : v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries (Global)</SelectItem>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Impact</Label>
                <Select value={createForm.impact} onValueChange={(v) => setCreateForm((f) => ({ ...f, impact: v ?? "Medium" }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPACTS.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ki-version" className="text-xs">Affected Version</Label>
                <Input
                  id="ki-version"
                  placeholder="e.g., 1.2.0"
                  value={createForm.affectedVersion}
                  onChange={(e) => setCreateForm((f) => ({ ...f, affectedVersion: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ki-reported-by" className="text-xs">Reported By *</Label>
                <Input
                  id="ki-reported-by"
                  placeholder="Your name"
                  value={createForm.reportedBy}
                  onChange={(e) => setCreateForm((f) => ({ ...f, reportedBy: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ki-assigned-to" className="text-xs">Assigned To</Label>
                <Input
                  id="ki-assigned-to"
                  placeholder="Assignee name"
                  value={createForm.assignedTo}
                  onChange={(e) => setCreateForm((f) => ({ ...f, assignedTo: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ki-related-defect" className="text-xs">Related Defect ID</Label>
                <Input
                  id="ki-related-defect"
                  placeholder="Defect ID if applicable"
                  value={createForm.relatedDefectId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, relatedDefectId: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {createForm.assignedTo && (
              <div>
                <Label htmlFor="ki-workaround" className="text-xs">Workaround (optional)</Label>
                <Textarea
                  id="ki-workaround"
                  placeholder="Steps to work around the issue"
                  value={createForm.workaround}
                  onChange={(e) => setCreateForm((f) => ({ ...f, workaround: e.target.value }))}
                  className="min-h-[60px] text-sm"
                />
              </div>
            )}

            <div>
              <Label htmlFor="ki-notes" className="text-xs">Notes</Label>
              <Textarea
                id="ki-notes"
                placeholder="Additional notes or context"
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                className="min-h-[60px] text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Known Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Details Dialog ────────────────────────────────────────────── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Known Issue Details
            </DialogTitle>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4 py-2">
              {/* Header */}
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-primary">{selectedIssue.issueNumber}</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs px-2 py-0.5", SEVERITY_COLORS[selectedIssue.severity as KnownIssueSeverity] ?? "")}
                >
                  {selectedIssue.severity}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs px-2 py-0.5", STATUS_COLORS[selectedIssue.status as KnownIssueStatus] ?? "")}
                >
                  {selectedIssue.status}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-semibold">{selectedIssue.title}</h3>

              {/* Description */}
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedIssue.description}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="mt-0.5">{selectedIssue.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Impact</Label>
                  <p className="mt-0.5">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5", IMPACT_COLORS[selectedIssue.impact as KnownIssueImpact] ?? "")}>
                      {selectedIssue.impact}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <p className="mt-0.5">{selectedIssue.country ?? "Global"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Occurrences</Label>
                  <p className="mt-0.5">{selectedIssue.occurrenceCount}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Affected Version</Label>
                  <p className="mt-0.5">{selectedIssue.affectedVersion ? `v${selectedIssue.affectedVersion}` : "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fixed Version</Label>
                  <p className="mt-0.5">{selectedIssue.fixedVersion ? `v${selectedIssue.fixedVersion}` : "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reported By</Label>
                  <p className="mt-0.5">{selectedIssue.reportedBy}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reported At</Label>
                  <p className="mt-0.5">{formatDate(selectedIssue.reportedAt)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Assigned To</Label>
                  <p className="mt-0.5">{selectedIssue.assignedTo ?? "Unassigned"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Related Defect</Label>
                  <p className="mt-0.5">{selectedIssue.relatedDefectId ?? "None"}</p>
                </div>
              </div>

              {/* Workaround */}
              {selectedIssue.workaround && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <Label className="text-xs text-amber-700 flex items-center gap-1">
                    <Wrench className="h-3 w-3" /> Workaround Available
                  </Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap text-amber-900">{selectedIssue.workaround}</p>
                </div>
              )}

              {/* Resolution */}
              {selectedIssue.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <Label className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Resolution
                  </Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap text-green-900">{selectedIssue.resolution}</p>
                  {selectedIssue.resolvedBy && (
                    <p className="text-xs text-green-600 mt-1">Resolved by {selectedIssue.resolvedBy} on {formatDate(selectedIssue.resolvedAt)}</p>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedIssue.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedIssue.notes}</p>
                </div>
              )}

              {/* Action buttons in view */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {getAvailableActions(selectedIssue.status).map((act) => {
                  const ActIcon = act.icon;
                  return (
                    <Button
                      key={act.action}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => {
                        setViewDialogOpen(false);
                        openActionDialog(selectedIssue, act.action);
                      }}
                    >
                      <ActIcon className="h-3.5 w-3.5" />
                      {act.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Action Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "investigate" && "Start Investigation"}
              {actionType === "workaround" && "Add Workaround"}
              {actionType === "planFix" && "Plan Fix"}
              {actionType === "fix" && "Mark as Fixed"}
              {actionType === "close" && "Close Issue"}
              {actionType === "defer" && "Defer Issue"}
            </DialogTitle>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm font-medium">{selectedIssue.issueNumber}: {selectedIssue.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current status: <Badge variant="outline" className={cn("text-[10px] px-1.5 h-4", STATUS_COLORS[selectedIssue.status as KnownIssueStatus] ?? "")}>{selectedIssue.status}</Badge>
                </p>
              </div>

              {actionType === "investigate" && (
                <div>
                  <Label htmlFor="act-assigned" className="text-xs">Assign To</Label>
                  <Input
                    id="act-assigned"
                    placeholder="Person assigned to investigate"
                    value={actionForm.assignedTo}
                    onChange={(e) => setActionForm((f) => ({ ...f, assignedTo: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Status will change to Investigating</p>
                </div>
              )}

              {actionType === "workaround" && (
                <div>
                  <Label htmlFor="act-workaround" className="text-xs">Workaround Steps *</Label>
                  <Textarea
                    id="act-workaround"
                    placeholder="Describe the workaround steps..."
                    value={actionForm.workaround}
                    onChange={(e) => setActionForm((f) => ({ ...f, workaround: e.target.value }))}
                    className="min-h-[100px] text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Status will change to WorkaroundAvailable</p>
                </div>
              )}

              {actionType === "planFix" && (
                <div>
                  <Label htmlFor="act-fixed-version" className="text-xs">Target Fixed Version</Label>
                  <Input
                    id="act-fixed-version"
                    placeholder="e.g., 1.3.0"
                    value={actionForm.fixedVersion}
                    onChange={(e) => setActionForm((f) => ({ ...f, fixedVersion: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Status will change to FixPlanned</p>
                </div>
              )}

              {actionType === "fix" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="act-resolved-by" className="text-xs">Resolved By</Label>
                    <Input
                      id="act-resolved-by"
                      placeholder="Name of person who fixed it"
                      value={actionForm.resolvedBy}
                      onChange={(e) => setActionForm((f) => ({ ...f, resolvedBy: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="act-resolution" className="text-xs">Resolution Details</Label>
                    <Textarea
                      id="act-resolution"
                      placeholder="How was the issue resolved?"
                      value={actionForm.resolution}
                      onChange={(e) => setActionForm((f) => ({ ...f, resolution: e.target.value }))}
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="act-fix-version" className="text-xs">Fixed Version</Label>
                    <Input
                      id="act-fix-version"
                      placeholder="e.g., 1.3.0"
                      value={actionForm.fixedVersion}
                      onChange={(e) => setActionForm((f) => ({ ...f, fixedVersion: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Status will change to Fixed</p>
                </div>
              )}

              {actionType === "close" && (
                <p className="text-sm text-muted-foreground">
                  This will close the known issue. The issue will be marked as resolved and no further actions will be available.
                </p>
              )}

              {actionType === "defer" && (
                <div>
                  <Label htmlFor="act-defer-notes" className="text-xs">Reason for Deferral</Label>
                  <Textarea
                    id="act-defer-notes"
                    placeholder="Explain why this issue is being deferred..."
                    value={actionForm.notes}
                    onChange={(e) => setActionForm((f) => ({ ...f, notes: e.target.value }))}
                    className="min-h-[80px] text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Status will change to Deferred</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={saving || (actionType === "workaround" && !actionForm.workaround)}
            >
              {saving ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
