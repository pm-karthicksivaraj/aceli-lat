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
  TrendingUp,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  User,
  Target,
  Lightbulb,
  Wrench,
  Eye,
  Zap,
  BarChart3,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type CIStatus = "Identified" | "Analyzed" | "Proposed" | "Approved" | "InProgress" | "Implemented" | "Verified";
type CICategory = "Process" | "Technology" | "People" | "Data" | "Governance" | "Integration";
type CIPriority = "Low" | "Medium" | "High" | "Critical";
type Country = "Kenya" | "Uganda" | "Tanzania" | "Ethiopia" | "Nigeria";

interface ContinuousImprovementItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  impact: string;
  proposedBy: string;
  assignedTo: string | null;
  targetDate: string | null;
  description: string | null;
  resolution: string | null;
  country: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];
const COUNTRY_FLAGS: Record<Country, string> = {
  Kenya: "\u{1F1F0}\u{1F1EA}",
  Uganda: "\u{1F1FA}\u{1F1EC}",
  Tanzania: "\u{1F1F9}\u{1F1FF}",
  Ethiopia: "\u{1F1EA}\u{1F1F9}",
  Nigeria: "\u{1F1F3}\u{1F1EC}",
};

const CI_STATUSES: CIStatus[] = ["Identified", "Analyzed", "Proposed", "Approved", "InProgress", "Implemented", "Verified"];
const CI_CATEGORIES: CICategory[] = ["Process", "Technology", "People", "Data", "Governance", "Integration"];
const CI_PRIORITIES: CIPriority[] = ["Low", "Medium", "High", "Critical"];
const SOURCE_OPTIONS = ["User Feedback", "KPI Analysis", "Audit Finding", "Incident Review", "Stakeholder Request", "Best Practice"];

const CATEGORY_COLORS: Record<CICategory, string> = {
  Process: "bg-blue-100 text-blue-800",
  Technology: "bg-purple-100 text-purple-800",
  People: "bg-green-100 text-green-800",
  Data: "bg-amber-100 text-amber-800",
  Governance: "bg-red-100 text-red-800",
  Integration: "bg-teal-100 text-teal-800",
};

const PRIORITY_COLORS: Record<CIPriority, string> = {
  Low: "bg-gray-100 text-gray-800 border-gray-300",
  Medium: "bg-blue-100 text-blue-800 border-blue-300",
  High: "bg-orange-100 text-orange-800 border-orange-300",
  Critical: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_ICONS: Record<CIStatus, React.ElementType> = {
  Identified: Lightbulb,
  Analyzed: Search,
  Proposed: Zap,
  Approved: CheckCircle,
  InProgress: Wrench,
  Implemented: ArrowRight,
  Verified: Eye,
};

const NEXT_STATUS_MAP: Record<CIStatus, CIStatus | null> = {
  Identified: "Analyzed",
  Analyzed: "Proposed",
  Proposed: "Approved",
  Approved: "InProgress",
  InProgress: "Implemented",
  Implemented: "Verified",
  Verified: null,
};

const NEXT_ACTION_LABEL: Record<CIStatus, string> = {
  Identified: "Analyze",
  Analyzed: "Propose",
  Proposed: "Approve",
  Approved: "Start",
  InProgress: "Implement",
  Implemented: "Verify",
  Verified: "Close",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ContinuousImprovementBoard() {
  // Data state
  const [items, setItems] = useState<ContinuousImprovementItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Process");
  const [formPriority, setFormPriority] = useState<string>("Medium");
  const [formSource, setFormSource] = useState<string>("User Feedback");
  const [formImpact, setFormImpact] = useState("");
  const [formProposedBy, setFormProposedBy] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formTargetDate, setFormTargetDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCountry, setFormCountry] = useState<string>("Kenya");

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ─── Fetch items ────────────────────────────────────────────────────────

  const fetchItems = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);

    fetch(`/api/continuous-improvement?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setItems(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.pageSize, statusFilter, categoryFilter, priorityFilter, countryFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);

    fetch(`/api/continuous-improvement?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setItems(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [pagination.page, pagination.pageSize, statusFilter, categoryFilter, priorityFilter, countryFilter]);

  // ─── Summary stats ─────────────────────────────────────────────────────

  const identifiedCount = items.filter((i) => i.status === "Identified").length;
  const inProgressCount = items.filter((i) => i.status === "InProgress" || i.status === "Approved").length;
  const implementedCount = items.filter((i) => i.status === "Implemented" || i.status === "Verified").length;
  const criticalCount = items.filter((i) => i.priority === "Critical" && i.status !== "Verified").length;

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formTitle || !formImpact || !formProposedBy) return;
    setSubmitting(true);
    try {
      await fetch("/api/continuous-improvement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          priority: formPriority,
          source: formSource,
          impact: formImpact,
          proposedBy: formProposedBy,
          assignedTo: formAssignedTo || undefined,
          targetDate: formTargetDate || undefined,
          description: formDescription || undefined,
          status: "Identified",
          country: formCountry,
        }),
      });
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchItems();
    } catch (error) {
      console.error("Error creating improvement item:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormTitle("");
    setFormCategory("Process");
    setFormPriority("Medium");
    setFormSource("User Feedback");
    setFormImpact("");
    setFormProposedBy("");
    setFormAssignedTo("");
    setFormTargetDate("");
    setFormDescription("");
    setFormCountry("Kenya");
  };

  const handleAdvance = async (item: ContinuousImprovementItem) => {
    const nextStatus = NEXT_STATUS_MAP[item.status as CIStatus];
    if (!nextStatus) return;
    setProcessing(true);
    try {
      await fetch(`/api/continuous-improvement/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchItems();
    } catch (error) {
      console.error("Error advancing item:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async (item: ContinuousImprovementItem) => {
    setProcessing(true);
    try {
      await fetch(`/api/continuous-improvement/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Verified", resolution: "Closed" }),
      });
      fetchItems();
    } catch (error) {
      console.error("Error closing item:", error);
    } finally {
      setProcessing(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getItemsByStatus = (status: CIStatus) => items.filter((i) => i.status === status);

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-52 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-0 border shadow-none">
              <CardContent className="p-4">
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Continuous Improvement</h2>
          <Badge variant="outline" className="text-xs">
            {pagination.total} item{pagination.total !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Improvement
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-muted-foreground">Identified</span>
            </div>
            <p className="text-2xl font-bold">{identifiedCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">In Progress</span>
            </div>
            <p className="text-2xl font-bold">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Implemented</span>
            </div>
            <p className="text-2xl font-bold">{implementedCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Critical Open</span>
            </div>
            <p className="text-2xl font-bold">{criticalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={categoryFilter}
          onValueChange={(v) => { setCategoryFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CI_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {CI_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(v) => { setPriorityFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {CI_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={countryFilter}
          onValueChange={(v) => { setCountryFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>{COUNTRY_FLAGS[c]} {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CI_STATUSES.map((status) => {
          const StatusIcon = STATUS_ICONS[status];
          const statusItems = getItemsByStatus(status);
          return (
            <div key={status} className="flex flex-col">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <StatusIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{status}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-auto">
                  {statusItems.length}
                </Badge>
              </div>

              {/* Column cards */}
              <div className="space-y-2 flex-1 min-h-[100px]">
                {statusItems.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                    No items
                  </div>
                ) : (
                  statusItems.map((item) => (
                    <Card key={item.id} className="p-0 border shadow-none hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <h4 className="text-sm font-medium mb-2 line-clamp-2">{item.title}</h4>
                        
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <Badge
                            className={cn(
                              "text-[9px] h-3.5 px-1",
                              CATEGORY_COLORS[item.category as CICategory] || "bg-gray-100 text-gray-800"
                            )}
                          >
                            {item.category}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-[9px] h-3.5 px-1",
                              PRIORITY_COLORS[item.priority as CIPriority] || "bg-gray-100 text-gray-800"
                            )}
                          >
                            {item.priority}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-[10px] text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>Impact: {item.impact}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{item.proposedBy}</span>
                          </div>
                          {item.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Assigned: {item.assignedTo}</span>
                            </div>
                          )}
                          {item.targetDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Target: {formatDate(item.targetDate)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            <span>Source: {item.source}</span>
                          </div>
                        </div>

                        {/* Advance button */}
                        {NEXT_STATUS_MAP[item.status as CIStatus] && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-5 text-[9px] px-1.5 w-full"
                            onClick={() => handleAdvance(item)}
                            disabled={processing}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {NEXT_ACTION_LABEL[item.status as CIStatus]}
                          </Button>
                        )}
                        {item.status === "Verified" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-5 text-[9px] px-1.5 w-full"
                            onClick={() => handleClose(item)}
                            disabled={processing}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Close
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Improvement Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Improvement Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Reduce data entry duplication"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category *</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "Process")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CI_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority *</Label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v ?? "Medium")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CI_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Source</Label>
                <Select value={formSource} onValueChange={(v) => setFormSource(v ?? "User Feedback")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Country</Label>
                <Select value={formCountry} onValueChange={(v) => setFormCountry(v ?? "Kenya")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{COUNTRY_FLAGS[c]} {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Impact *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formImpact}
                onChange={(e) => setFormImpact(e.target.value)}
                placeholder="e.g., 30% reduction in processing time"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Proposed By *</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  value={formProposedBy}
                  onChange={(e) => setFormProposedBy(e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div>
                <Label className="text-xs">Assigned To</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                  placeholder="Name"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Target Date</Label>
              <Input
                type="date"
                className="h-8 text-sm mt-1"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                className="text-sm mt-1 min-h-[60px]"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Detailed description of the improvement..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
