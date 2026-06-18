"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  Bug,
  Plus,
  RefreshCw,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DefectReport,
  DefectSeverity,
  DefectPriority,
  DefectStatus,
  DefectCategory,
  Country,
} from "@/lib/types";
import { DEFECT_SEVERITY_COLORS, COUNTRY_FLAGS } from "@/lib/types";

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];
const DEFECT_SEVERITIES: DefectSeverity[] = ["Low", "Medium", "High", "Critical", "Blocker"];
const DEFECT_PRIORITIES: DefectPriority[] = ["Low", "Normal", "High", "Urgent"];
const DEFECT_CATEGORIES: DefectCategory[] = [
  "Functional",
  "Performance",
  "Security",
  "DataIntegrity",
  "UX",
  "Integration",
  "Offline",
  "Sync",
];

const KANBAN_COLUMNS: { status: DefectStatus; label: string; color: string }[] = [
  { status: "Open", label: "Open", color: "bg-gray-50" },
  { status: "Triaged", label: "Triaged", color: "bg-amber-50" },
  { status: "InProgress", label: "In Progress", color: "bg-blue-50" },
  { status: "Fixed", label: "Fixed", color: "bg-green-50" },
  { status: "Verified", label: "Verified", color: "bg-teal-50" },
  { status: "Closed", label: "Closed", color: "bg-muted" },
];

const PRIORITY_COLORS: Record<DefectPriority, string> = {
  Low: "bg-gray-100 text-gray-800",
  Normal: "bg-blue-100 text-blue-800",
  High: "bg-orange-100 text-orange-800",
  Urgent: "bg-red-100 text-red-800",
};

const DEFECT_CATEGORY_COLORS: Record<DefectCategory, string> = {
  Functional: "bg-purple-100 text-purple-800",
  Performance: "bg-orange-100 text-orange-800",
  Security: "bg-red-100 text-red-800",
  DataIntegrity: "bg-amber-100 text-amber-800",
  UX: "bg-cyan-100 text-cyan-800",
  Integration: "bg-blue-100 text-blue-800",
  Offline: "bg-gray-100 text-gray-800",
  Sync: "bg-green-100 text-green-800",
};

const CATEGORY_LABELS: Record<DefectCategory, string> = {
  Functional: "Functional",
  Performance: "Performance",
  Security: "Security",
  DataIntegrity: "Data Integrity",
  UX: "UX",
  Integration: "Integration",
  Offline: "Offline",
  Sync: "Sync",
};

function getNextAction(status: DefectStatus): { label: string; nextStatus: DefectStatus } | null {
  switch (status) {
    case "Open":
      return { label: "Triage", nextStatus: "Triaged" };
    case "Triaged":
      return { label: "Assign", nextStatus: "InProgress" };
    case "InProgress":
      return { label: "Fix", nextStatus: "Fixed" };
    case "Fixed":
      return { label: "Verify", nextStatus: "Verified" };
    case "Verified":
      return { label: "Close", nextStatus: "Closed" };
    default:
      return null;
  }
}

export function DefectTriageBoard() {
  const [defects, setDefects] = useState<DefectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Detail dialog
  const [detailDefect, setDetailDefect] = useState<DefectReport | null>(null);

  // Report dialog
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSeverity, setFormSeverity] = useState<DefectSeverity>("Medium");
  const [formPriority, setFormPriority] = useState<DefectPriority>("Normal");
  const [formCategory, setFormCategory] = useState<DefectCategory>("Functional");
  const [formCountry, setFormCountry] = useState<Country>("Kenya");
  const [formReportedBy, setFormReportedBy] = useState("");
  const [formStepsToReproduce, setFormStepsToReproduce] = useState("");
  const [formExpectedResult, setFormExpectedResult] = useState("");
  const [formActualResult, setFormActualResult] = useState("");

  // Action dialog
  const [actionDialogDefectId, setActionDialogDefectId] = useState<string | null>(null);
  const [actionDialogStatus, setActionDialogStatus] = useState<DefectStatus | null>(null);
  const [actionAssignTo, setActionAssignTo] = useState("");
  const [actionResolution, setActionResolution] = useState("");
  const [processing, setProcessing] = useState(false);

  const buildDefectParams = useCallback(() => {
    const params = new URLSearchParams();
    if (severityFilter && severityFilter !== "all") params.set("severity", severityFilter);
    if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
    if (countryFilter && countryFilter !== "all") params.set("country", countryFilter);
    return params;
  }, [severityFilter, categoryFilter, countryFilter]);

  const fetchDefects = useCallback(() => {
    const params = buildDefectParams();
    setLoading(true);
    fetch(`/api/defects?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setDefects(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buildDefectParams]);

  useEffect(() => {
    const controller = new AbortController();
    const params = buildDefectParams();
    fetch(`/api/defects?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setDefects(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [buildDefectParams]);

  const handleReportDefect = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          severity: formSeverity,
          priority: formPriority,
          category: formCategory,
          country: formCountry,
          reportedBy: formReportedBy,
          stepsToReproduce: formStepsToReproduce || null,
          expectedResult: formExpectedResult || null,
          actualResult: formActualResult || null,
        }),
      });
      setReportDialogOpen(false);
      setFormTitle("");
      setFormDescription("");
      setFormReportedBy("");
      setFormStepsToReproduce("");
      setFormExpectedResult("");
      setFormActualResult("");
      fetchDefects();
    } catch {
      // Error
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusAction = async () => {
    if (!actionDialogDefectId || !actionDialogStatus) return;
    setProcessing(true);
    try {
      const body: Record<string, unknown> = { status: actionDialogStatus };
      if (actionAssignTo) body.assignedTo = actionAssignTo;
      if (actionResolution) body.resolution = actionResolution;
      if (actionDialogStatus === "Closed") body.resolvedBy = "admin";
      if (actionDialogStatus === "Verified") body.verifiedBy = "admin";

      await fetch(`/api/defects/${actionDialogDefectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setActionDialogDefectId(null);
      setActionAssignTo("");
      setActionResolution("");
      fetchDefects();
    } catch {
      // Error
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (defectId: string, nextStatus: DefectStatus) => {
    setActionDialogDefectId(defectId);
    setActionDialogStatus(nextStatus);
  };

  // Group defects by status for Kanban
  const defectsByStatus = KANBAN_COLUMNS.map((col) => ({
    ...col,
    defects: defects.filter((d) => d.status === col.status),
  }));

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? "all")}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {DEFECT_SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {DEFECT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={(v) => setCountryFilter(v ?? "all")}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {COUNTRY_FLAGS[c]} {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5 ml-auto">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchDefects}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setReportDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Report Defect
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-muted rounded mb-2 w-20" />
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : defects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bug className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No defects found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Report a defect to start tracking issues
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-280px)]">
          <div className="flex gap-3 pb-4 min-w-max">
            {defectsByStatus.map((col) => (
              <div key={col.status} className="w-64 shrink-0">
                {/* Column Header */}
                <div className={cn("flex items-center justify-between rounded-t-lg px-3 py-2", col.color)}>
                  <span className="text-xs font-medium">{col.label}</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1">
                    {col.defects.length}
                  </Badge>
                </div>

                {/* Column Cards */}
                <div className="space-y-2 mt-2">
                  {col.defects.map((defect) => {
                    const severityColor = DEFECT_SEVERITY_COLORS[defect.severity as DefectSeverity] || DEFECT_SEVERITY_COLORS.Medium;
                    const priorityColor = PRIORITY_COLORS[defect.priority as DefectPriority] || PRIORITY_COLORS.Normal;
                    const categoryColor = DEFECT_CATEGORY_COLORS[defect.category as DefectCategory] || "bg-gray-100 text-gray-800";
                    const nextAction = getNextAction(defect.status as DefectStatus);

                    return (
                      <Card
                        key={defect.id}
                        className="transition-all hover:shadow-sm cursor-pointer"
                        onClick={() => setDetailDefect(defect)}
                      >
                        <CardContent className="p-3">
                          <p className="text-xs font-medium leading-tight mb-2 line-clamp-2">
                            {defect.title}
                          </p>
                          <div className="flex items-center gap-1 flex-wrap mb-1.5">
                            <Badge variant="outline" className={cn("text-[8px] h-4 px-1 border", severityColor)}>
                              {defect.severity}
                            </Badge>
                            <Badge variant="outline" className={cn("text-[8px] h-4 px-1", priorityColor)}>
                              {defect.priority}
                            </Badge>
                            <Badge variant="outline" className={cn("text-[8px] h-4 px-1", categoryColor)}>
                              {CATEGORY_LABELS[defect.category as DefectCategory] || defect.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <span>{COUNTRY_FLAGS[defect.country as Country] || ""}</span>
                            <span>by {defect.reportedBy}</span>
                          </div>

                          {/* Quick Action Button */}
                          {nextAction && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 text-[9px] p-0 gap-0.5 text-primary hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openActionDialog(defect.id, nextAction.nextStatus);
                                }}
                              >
                                {nextAction.label}
                                <ChevronRight className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {col.defects.length === 0 && (
                    <div className="py-6 text-center text-[10px] text-muted-foreground">
                      No items
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailDefect} onOpenChange={() => setDetailDefect(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailDefect && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm">{detailDefect.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5 border", DEFECT_SEVERITY_COLORS[detailDefect.severity as DefectSeverity] || DEFECT_SEVERITY_COLORS.Medium)}>
                    {detailDefect.severity}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5", PRIORITY_COLORS[detailDefect.priority as DefectPriority] || PRIORITY_COLORS.Normal)}>
                    {detailDefect.priority} Priority
                  </Badge>
                  <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5", DEFECT_CATEGORY_COLORS[detailDefect.category as DefectCategory] || "bg-gray-100 text-gray-800")}>
                    {CATEGORY_LABELS[detailDefect.category as DefectCategory] || detailDefect.category}
                  </Badge>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Description</p>
                  <p className="text-xs leading-relaxed">{detailDefect.description}</p>
                </div>

                {detailDefect.stepsToReproduce && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Steps to Reproduce</p>
                    <p className="text-xs leading-relaxed bg-muted p-2 rounded">{detailDefect.stepsToReproduce}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {detailDefect.expectedResult && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Expected Result</p>
                      <p className="text-xs leading-relaxed bg-green-50 p-2 rounded text-green-800">{detailDefect.expectedResult}</p>
                    </div>
                  )}
                  {detailDefect.actualResult && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Actual Result</p>
                      <p className="text-xs leading-relaxed bg-red-50 p-2 rounded text-red-800">{detailDefect.actualResult}</p>
                    </div>
                  )}
                </div>

                {detailDefect.resolution && (
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-[10px] text-green-800 font-medium">Resolution</p>
                    <p className="text-xs text-green-800">{detailDefect.resolution}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border">
                  <span>{COUNTRY_FLAGS[detailDefect.country as Country] || ""} {detailDefect.country}</span>
                  <span>Reported by: {detailDefect.reportedBy}</span>
                  {detailDefect.assignedTo && <span>Assigned to: {detailDefect.assignedTo}</span>}
                </div>

                {/* Action Buttons */}
                {getNextAction(detailDefect.status as DefectStatus) && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={() => {
                        const action = getNextAction(detailDefect.status as DefectStatus);
                        if (action) {
                          openActionDialog(detailDefect.id, action.nextStatus);
                          setDetailDefect(null);
                        }
                      }}
                    >
                      {getNextAction(detailDefect.status as DefectStatus)?.label}
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Defect Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Report Defect</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Brief summary of the defect"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                className="min-h-[60px] text-xs"
                placeholder="Detailed description of the issue..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as DefectSeverity)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFECT_SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as DefectPriority)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFECT_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as DefectCategory)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFECT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Select value={formCountry} onValueChange={(v) => setFormCountry(v as Country)}>
                  <SelectTrigger className="h-8 text-xs">
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reported By</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Your name"
                value={formReportedBy}
                onChange={(e) => setFormReportedBy(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Steps to Reproduce (optional)</Label>
              <Textarea
                className="min-h-[50px] text-xs"
                placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe..."
                value={formStepsToReproduce}
                onChange={(e) => setFormStepsToReproduce(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Expected Result (optional)</Label>
                <Textarea
                  className="min-h-[50px] text-xs"
                  placeholder="What should happen"
                  value={formExpectedResult}
                  onChange={(e) => setFormExpectedResult(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Actual Result (optional)</Label>
                <Textarea
                  className="min-h-[50px] text-xs"
                  placeholder="What actually happened"
                  value={formActualResult}
                  onChange={(e) => setFormActualResult(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReportDefect}
              disabled={submitting || !formTitle || !formDescription || !formReportedBy}
            >
              {submitting ? "Reporting..." : "Report Defect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Action Dialog */}
      <Dialog open={!!actionDialogDefectId} onOpenChange={() => setActionDialogDefectId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {actionDialogStatus === "Triaged" && "Triage Defect"}
              {actionDialogStatus === "InProgress" && "Assign Defect"}
              {actionDialogStatus === "Fixed" && "Mark as Fixed"}
              {actionDialogStatus === "Verified" && "Verify Defect"}
              {actionDialogStatus === "Closed" && "Close Defect"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(actionDialogStatus === "InProgress" || actionDialogStatus === "Triaged") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Assign To</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Team member name"
                  value={actionAssignTo}
                  onChange={(e) => setActionAssignTo(e.target.value)}
                />
              </div>
            )}
            {(actionDialogStatus === "Fixed" || actionDialogStatus === "Closed") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Resolution</Label>
                <Textarea
                  className="min-h-[80px] text-xs"
                  placeholder="Describe the resolution..."
                  value={actionResolution}
                  onChange={(e) => setActionResolution(e.target.value)}
                />
              </div>
            )}
            {actionDialogStatus === "Verified" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Confirm this defect has been verified as fixed
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActionDialogDefectId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleStatusAction}
              disabled={processing || (actionDialogStatus === "Fixed" && !actionResolution.trim())}
            >
              {processing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
