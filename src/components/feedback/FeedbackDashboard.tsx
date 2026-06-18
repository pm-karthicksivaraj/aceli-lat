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
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  UserFeedback,
  FeedbackCategory,
  FeedbackStatus,
  ExceptionSeverity,
  Country,
} from "@/lib/types";
import { FEEDBACK_CATEGORY_COLORS, COUNTRY_FLAGS } from "@/lib/types";

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];
const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  "Bug",
  "FeatureRequest",
  "Usability",
  "Performance",
  "DataQuality",
  "Workflow",
  "Training",
  "Other",
];
const FEEDBACK_STATUSES: FeedbackStatus[] = [
  "Submitted",
  "Triaged",
  "InProgress",
  "Resolved",
  "Dismissed",
];
const SEVERITY_OPTIONS: ExceptionSeverity[] = ["Low", "Medium", "High", "Critical"];

const FEEDBACK_STATUS_COLORS: Record<FeedbackStatus, string> = {
  Submitted: "bg-blue-50 text-blue-700 border-blue-300",
  Triaged: "bg-amber-50 text-amber-700 border-amber-300",
  InProgress: "bg-sky-50 text-sky-700 border-sky-300",
  Resolved: "bg-green-50 text-green-700 border-green-300",
  Dismissed: "bg-gray-50 text-gray-700 border-gray-300",
};

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  Bug: "Bug",
  FeatureRequest: "Feature Request",
  Usability: "Usability",
  Performance: "Performance",
  DataQuality: "Data Quality",
  Workflow: "Workflow",
  Training: "Training",
  Other: "Other",
};

type TabType = "submit" | "all";

export function FeedbackDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Submit form
  const [formCategory, setFormCategory] = useState<FeedbackCategory>("Bug");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSeverity, setFormSeverity] = useState<ExceptionSeverity>("Medium");
  const [formCountry, setFormCountry] = useState<Country>("Kenya");
  const [formSubmittedBy, setFormSubmittedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Action dialogs
  const [triageDialogId, setTriageDialogId] = useState<string | null>(null);
  const [resolveDialogId, setResolveDialogId] = useState<string | null>(null);
  const [triagedBy, setTriagedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [resolution, setResolution] = useState("");
  const [processing, setProcessing] = useState(false);

  const buildFeedbackParams = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
    if (severityFilter && severityFilter !== "all") params.set("severity", severityFilter);
    return params;
  }, [statusFilter, categoryFilter, severityFilter]);

  const fetchFeedback = useCallback(() => {
    const params = buildFeedbackParams();
    setLoading(true);
    fetch(`/api/feedback?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setFeedback(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buildFeedbackParams]);

  useEffect(() => {
    const controller = new AbortController();
    const params = buildFeedbackParams();
    fetch(`/api/feedback?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setFeedback(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [buildFeedbackParams]);

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formCategory,
          title: formTitle,
          description: formDescription,
          severity: formSeverity,
          country: formCountry,
          submittedBy: formSubmittedBy,
        }),
      });
      setFormTitle("");
      setFormDescription("");
      setFormSubmittedBy("");
      setActiveTab("all");
      fetchFeedback();
    } catch {
      // Error
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriage = async () => {
    if (!triageDialogId) return;
    setProcessing(true);
    try {
      await fetch(`/api/feedback/${triageDialogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Triaged",
          triagedBy,
          assignedTo,
        }),
      });
      setTriageDialogId(null);
      setTriagedBy("");
      setAssignedTo("");
      fetchFeedback();
    } catch {
      // Error
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveDialogId) return;
    setProcessing(true);
    try {
      await fetch(`/api/feedback/${resolveDialogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Resolved",
          resolution,
          resolvedBy: assignedTo || "admin",
        }),
      });
      setResolveDialogId(null);
      setResolution("");
      fetchFeedback();
    } catch {
      // Error
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setActiveTab("all")}
        >
          <MessageSquare className="size-3.5" />
          All Feedback
        </Button>
        <Button
          variant={activeTab === "submit" ? "default" : "outline"}
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setActiveTab("submit")}
        >
          <Plus className="size-3.5" />
          Submit Feedback
        </Button>
      </div>

      {activeTab === "submit" ? (
        /* Submit Feedback Form */
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as FeedbackCategory)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as ExceptionSeverity)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Brief summary of your feedback"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                className="min-h-[80px] text-xs"
                placeholder="Describe the issue or suggestion in detail..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="space-y-1.5">
                <Label className="text-xs">Submitted By</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Your name"
                  value={formSubmittedBy}
                  onChange={(e) => setFormSubmittedBy(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={submitting || !formTitle || !formDescription || !formSubmittedBy}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* All Feedback List */
        <>
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {FEEDBACK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {FEEDBACK_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? "all")}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                {SEVERITY_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 text-xs ml-auto" onClick={fetchFeedback}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Feedback List */}
          <ScrollArea className="max-h-[calc(100vh-340px)]">
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))
              ) : feedback.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No feedback found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submit feedback to help improve the platform
                    </p>
                  </CardContent>
                </Card>
              ) : (
                feedback.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const categoryColor = FEEDBACK_CATEGORY_COLORS[item.category as FeedbackCategory] || "bg-gray-100 text-gray-800";
                  const statusColor = FEEDBACK_STATUS_COLORS[item.status as FeedbackStatus] || "bg-gray-50 text-gray-700";

                  return (
                    <Card key={item.id} className="transition-all hover:shadow-sm">
                      <CardContent className="p-4">
                        <div
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5 border", categoryColor)}>
                                {CATEGORY_LABELS[item.category as FeedbackCategory] || item.category}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] h-5 px-1.5 border-amber-300 bg-amber-50 text-amber-700">
                                {item.severity}
                              </Badge>
                              <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5 border", statusColor)}>
                                {item.status === "Resolved" && <CheckCircle className="h-2.5 w-2.5 mr-0.5" />}
                                {item.status === "Submitted" && <Clock className="h-2.5 w-2.5 mr-0.5" />}
                                {item.status === "InProgress" && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                                {item.status}
                              </Badge>
                            </div>
                            <p className="text-xs font-medium leading-tight mb-1">{item.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{COUNTRY_FLAGS[item.country as Country] || ""} {item.country}</span>
                              <span>by {item.submittedBy}</span>
                              <span>{formatDate(item.createdAt)}</span>
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
                          <div className="mt-3 pt-3 border-t border-border space-y-2">
                            <p className="text-xs text-foreground leading-relaxed">{item.description}</p>
                            {item.triagedBy && (
                              <div className="text-[10px] text-muted-foreground">
                                Triaged by: <span className="font-medium">{item.triagedBy}</span>
                                {item.assignedTo && <> · Assigned to: <span className="font-medium">{item.assignedTo}</span></>}
                              </div>
                            )}
                            {item.resolution && (
                              <div className="p-2 bg-green-50 rounded text-xs text-green-800">
                                <span className="font-medium">Resolution:</span> {item.resolution}
                              </div>
                            )}

                            {/* Action Buttons */}
                            {(item.status === "Submitted" || item.status === "Triaged" || item.status === "InProgress") && (
                              <div className="flex items-center gap-1.5 pt-2">
                                {item.status === "Submitted" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTriageDialogId(item.id);
                                    }}
                                  >
                                    Triage
                                  </Button>
                                )}
                                {(item.status === "Triaged" || item.status === "InProgress") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] border-green-300 text-green-700 hover:bg-green-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setResolveDialogId(item.id);
                                    }}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-0.5" />
                                    Resolve
                                  </Button>
                                )}
                              </div>
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
        </>
      )}

      {/* Triage Dialog */}
      <Dialog open={!!triageDialogId} onOpenChange={() => setTriageDialogId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Triage Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Triaged By</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Your name"
                value={triagedBy}
                onChange={(e) => setTriagedBy(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assign To</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Assign to team member"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTriageDialogId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleTriage}
              disabled={processing || !triagedBy}
            >
              {processing ? "Saving..." : "Triage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialogId} onOpenChange={() => setResolveDialogId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Resolve Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Resolution</Label>
              <Textarea
                className="min-h-[80px] text-xs"
                placeholder="Describe how this feedback was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResolveDialogId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleResolve}
              disabled={processing || !resolution.trim()}
            >
              {processing ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
