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
import { UserCheck, Plus, CheckCircle, XCircle, ArrowRight, Clock, ClipboardCheck } from "lucide-react";

// ─── Types ───

interface AdminHandover {
  id: string;
  country: string;
  handoverType: string;
  status: string;
  plannedDate: string;
  completedDate: string | null;
  fromPerson: string;
  fromPersonEmail: string | null;
  toPerson: string;
  toPersonEmail: string | null;
  checklistItems: string | null;
  completedItems: number;
  totalItems: number;
  knowledgeTransferStatus: string;
  documentationStatus: string;
  accessTransferStatus: string;
  signOffBy: string | null;
  signOffAt: string | null;
  signOffStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  title: string;
  completed: boolean;
}

// ─── Constants ───

const COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria", "Global"] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  Kenya: "\u{1F1F0}\u{1F1EA}",
  Uganda: "\u{1F1FA}\u{1F1EC}",
  Tanzania: "\u{1F1F9}\u{1F1FF}",
  Ethiopia: "\u{1F1EA}\u{1F1F9}",
  Nigeria: "\u{1F1F3}\u{1F1EC}",
  Global: "\u{1F30D}",
};

const HANDOVER_TYPE_LABELS: Record<string, string> = {
  FullHandover: "Full Handover",
  PartialHandover: "Partial Handover",
  RoleTransition: "Role Transition",
};

const HANDOVER_STATUS_COLORS: Record<string, string> = {
  Planned: "bg-gray-50 text-gray-700 border-gray-300",
  InProgress: "bg-blue-50 text-blue-700 border-blue-300",
  Completed: "bg-green-50 text-green-700 border-green-300",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-300",
  Rejected: "bg-red-50 text-red-700 border-red-300",
};

const HANDOVER_STATUS_ICONS: Record<string, React.ElementType> = {
  Planned: Clock,
  InProgress: ArrowRight,
  Completed: CheckCircle,
  Accepted: CheckCircle,
  Rejected: XCircle,
};

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  NotStarted: "bg-gray-100 text-gray-600 border-gray-300",
  InProgress: "bg-amber-50 text-amber-700 border-amber-300",
  Completed: "bg-green-50 text-green-700 border-green-300",
};

const TRANSFER_STATUS_ICONS: Record<string, React.ElementType> = {
  NotStarted: Clock,
  InProgress: ArrowRight,
  Completed: CheckCircle,
};

const SIGNOFF_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-300",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-300",
  Rejected: "bg-red-50 text-red-700 border-red-300",
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { title: "System access credentials transferred", completed: false },
  { title: "Documentation handed over (SOPs, runbooks)", completed: false },
  { title: "Outstanding issues / known bugs briefed", completed: false },
  { title: "Key stakeholder contacts introduced", completed: false },
  { title: "Pending approvals / sign-offs reviewed", completed: false },
  { title: "Monitoring & alerting ownership confirmed", completed: false },
];

// ─── Component ───

export function AdminHandoverChecklist() {
  const [handovers, setHandovers] = useState<AdminHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Selected handover for actions
  const [selectedHandover, setSelectedHandover] = useState<AdminHandover | null>(null);

  // Submitting states
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [formCountry, setFormCountry] = useState<string>("Kenya");
  const [formType, setFormType] = useState<string>("FullHandover");
  const [formPlannedDate, setFormPlannedDate] = useState("");
  const [formFromPerson, setFormFromPerson] = useState("");
  const [formFromEmail, setFormFromEmail] = useState("");
  const [formToPerson, setFormToPerson] = useState("");
  const [formToEmail, setFormToEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Transfer status form
  const [formKnowledgeStatus, setFormKnowledgeStatus] = useState<string>("NotStarted");
  const [formDocumentationStatus, setFormDocumentationStatus] = useState<string>("NotStarted");
  const [formAccessStatus, setFormAccessStatus] = useState<string>("NotStarted");

  // Checklist form
  const [formChecklistItems, setFormChecklistItems] = useState<ChecklistItem[]>([]);

  // Reject form
  const [formRejectNotes, setFormRejectNotes] = useState("");

  // ─── Fetch ───

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (countryFilter && countryFilter !== "all") params.set("country", countryFilter);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter && typeFilter !== "all") params.set("handoverType", typeFilter);
    params.set("pageSize", "50");
    return params;
  }, [countryFilter, statusFilter, typeFilter]);

  const fetchHandovers = useCallback(() => {
    const params = buildParams();
    setLoading(true);
    setError(null);
    fetch(`/api/handover?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch handovers");
        return res.json();
      })
      .then((data) => {
        const records = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setHandovers(records);
      })
      .catch((err) => {
        setError(err.message || "Failed to load handovers");
        setHandovers([]);
      })
      .finally(() => setLoading(false));
  }, [buildParams]);

  useEffect(() => {
    const controller = new AbortController();
    const params = buildParams();
    fetch(`/api/handover?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch handovers");
        return res.json();
      })
      .then((data) => {
        const records = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setHandovers(records);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load handovers");
          setHandovers([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [buildParams]);

  // ─── Helpers ───

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const parseChecklist = (raw: string | null): ChecklistItem[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item: Record<string, unknown>) => ({
          title: String(item.title ?? item.name ?? ""),
          completed: Boolean(item.completed ?? item.done ?? false),
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const getProgressPercent = (h: AdminHandover) => {
    if (h.totalItems === 0) return 0;
    return Math.round((h.completedItems / h.totalItems) * 100);
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return "bg-green-500";
    if (pct >= 40) return "bg-amber-500";
    return "bg-red-400";
  };

  // ─── Actions ───

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const checklistItems = JSON.stringify(DEFAULT_CHECKLIST);
      const res = await fetch("/api/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: formCountry,
          handoverType: formType,
          plannedDate: formPlannedDate,
          fromPerson: formFromPerson,
          fromPersonEmail: formFromEmail || null,
          toPerson: formToPerson,
          toPersonEmail: formToEmail || null,
          checklistItems,
          totalItems: DEFAULT_CHECKLIST.length,
          notes: formNotes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create handover");
      }
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchHandovers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create handover");
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormCountry("Kenya");
    setFormType("FullHandover");
    setFormPlannedDate("");
    setFormFromPerson("");
    setFormFromEmail("");
    setFormToPerson("");
    setFormToEmail("");
    setFormNotes("");
  };

  const handleAction = async (id: string, action: string, body: Record<string, unknown> = {}) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/handover/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      fetchHandovers();
      // Refresh selected handover if detail dialog is open
      if (selectedHandover?.id === id) {
        const detail = await (await fetch(`/api/handover/${id}`)).json();
        setSelectedHandover(detail?.data ?? detail ?? null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = (h: AdminHandover) => handleAction(h.id, "start");

  const handleComplete = (h: AdminHandover) => handleAction(h.id, "complete");

  const handleAcceptSignOff = (h: AdminHandover) => {
    handleAction(h.id, "accept", { signOffBy: "Current User" });
  };

  const openRejectDialog = (h: AdminHandover) => {
    setSelectedHandover(h);
    setFormRejectNotes("");
    setRejectDialogOpen(true);
  };

  const handleRejectSignOff = async () => {
    if (!selectedHandover) return;
    await handleAction(selectedHandover.id, "reject", {
      signOffBy: "Current User",
      notes: formRejectNotes || selectedHandover.notes,
    });
    setRejectDialogOpen(false);
  };

  const openTransferDialog = (h: AdminHandover) => {
    setSelectedHandover(h);
    setFormKnowledgeStatus(h.knowledgeTransferStatus ?? "NotStarted");
    setFormDocumentationStatus(h.documentationStatus ?? "NotStarted");
    setFormAccessStatus(h.accessTransferStatus ?? "NotStarted");
    setTransferDialogOpen(true);
  };

  const handleUpdateTransfer = async () => {
    if (!selectedHandover) return;
    await handleAction(selectedHandover.id, "updateTransfer", {
      knowledgeTransferStatus: formKnowledgeStatus,
      documentationStatus: formDocumentationStatus,
      accessTransferStatus: formAccessStatus,
    });
    setTransferDialogOpen(false);
  };

  const openChecklistDialog = (h: AdminHandover) => {
    setSelectedHandover(h);
    const items = parseChecklist(h.checklistItems);
    if (items.length === 0) {
      // If no items exist yet, use defaults
      setFormChecklistItems(DEFAULT_CHECKLIST.map((ci) => ({ ...ci })));
    } else {
      setFormChecklistItems(items);
    }
    setChecklistDialogOpen(true);
  };

  const toggleChecklistItem = (index: number) => {
    setFormChecklistItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleUpdateChecklist = async () => {
    if (!selectedHandover) return;
    const completedCount = formChecklistItems.filter((i) => i.completed).length;
    await handleAction(selectedHandover.id, "updateChecklist", {
      checklistItems: JSON.stringify(formChecklistItems),
      completedItems: completedCount,
      totalItems: formChecklistItems.length,
    });
    setChecklistDialogOpen(false);
  };

  const openDetailDialog = async (h: AdminHandover) => {
    setSelectedHandover(h);
    setDetailDialogOpen(true);
    // Fetch full detail
    try {
      const res = await fetch(`/api/handover/${h.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedHandover(data?.data ?? data ?? h);
      }
    } catch {
      // Use existing data
    }
  };

  // ─── Summary stats ───

  const totalHandovers = handovers.length;
  const plannedCount = handovers.filter((h) => h.status === "Planned").length;
  const inProgressCount = handovers.filter((h) => h.status === "InProgress").length;
  const completedCount = handovers.filter((h) => ["Completed", "Accepted"].includes(h.status)).length;

  // ─── Render ───

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-lg font-bold">{totalHandovers}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Total Handovers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-lg font-bold text-gray-600">{plannedCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-lg font-bold text-blue-600">{inProgressCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <p className="text-lg font-bold text-green-600">{completedCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Actions */}
      <div className="flex items-center gap-2 flex-wrap">
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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Planned">Planned</SelectItem>
            <SelectItem value="InProgress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Handover Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="FullHandover">Full Handover</SelectItem>
            <SelectItem value="PartialHandover">Partial Handover</SelectItem>
            <SelectItem value="RoleTransition">Role Transition</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 text-xs ml-auto gap-1.5"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Handover
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
            <Button variant="ghost" size="sm" className="ml-auto h-6 text-[10px]" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Handover Cards */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : handovers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No handovers found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a new handover to start tracking admin transitions
              </p>
            </CardContent>
          </Card>
        ) : (
          handovers.map((h) => {
            const StatusIcon = HANDOVER_STATUS_ICONS[h.status] || Clock;
            const statusColor = HANDOVER_STATUS_COLORS[h.status] || HANDOVER_STATUS_COLORS.Planned;
            const progressPct = getProgressPercent(h);

            return (
              <Card
                key={h.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetailDialog(h)}
              >
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">{COUNTRY_FLAGS[h.country] || ""}</span>
                      <span className="text-xs font-medium">{h.country}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 border bg-muted/50">
                        {HANDOVER_TYPE_LABELS[h.handoverType] || h.handoverType}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border", statusColor)}>
                        <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                        {h.status}
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] h-4 px-1.5 border", SIGNOFF_STATUS_COLORS[h.signOffStatus] || SIGNOFF_STATUS_COLORS.Pending)}
                    >
                      Sign-off: {h.signOffStatus}
                    </Badge>
                  </div>

                  {/* From → To */}
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-blue-700">
                          {h.fromPerson.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{h.fromPerson}</p>
                        {h.fromPersonEmail && (
                          <p className="text-[10px] text-muted-foreground">{h.fromPersonEmail}</p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-green-700">
                          {h.toPerson.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{h.toPerson}</p>
                        {h.toPersonEmail && (
                          <p className="text-[10px] text-muted-foreground">{h.toPersonEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 mb-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Planned: {formatDate(h.plannedDate)}
                    </span>
                    {h.completedDate && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Completed: {formatDate(h.completedDate)}
                      </span>
                    )}
                  </div>

                  {/* Checklist Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">
                        Checklist Progress
                      </span>
                      <span className="text-[10px] font-medium">
                        {h.completedItems}/{h.totalItems} ({progressPct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getProgressColor(progressPct))}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Transfer Statuses */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Knowledge", status: h.knowledgeTransferStatus },
                      { label: "Documentation", status: h.documentationStatus },
                      { label: "Access", status: h.accessTransferStatus },
                    ].map((transfer) => {
                      const TIcon = TRANSFER_STATUS_ICONS[transfer.status] || Clock;
                      const tColor = TRANSFER_STATUS_COLORS[transfer.status] || TRANSFER_STATUS_COLORS.NotStarted;
                      return (
                        <div
                          key={transfer.label}
                          className={cn("rounded-md px-2 py-1.5 border text-center", tColor)}
                        >
                          <TIcon className="h-3 w-3 mx-auto mb-0.5" />
                          <p className="text-[9px] font-medium">{transfer.label}</p>
                          <p className="text-[8px] opacity-75">
                            {transfer.status === "NotStarted"
                              ? "Not Started"
                              : transfer.status === "InProgress"
                              ? "In Progress"
                              : "Completed"}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {h.status === "Planned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => handleStart(h)}
                        disabled={actionLoading}
                      >
                        <ArrowRight className="h-3 w-3" />
                        Start
                      </Button>
                    )}
                    {h.status === "InProgress" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1"
                          onClick={() => handleComplete(h)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1"
                          onClick={() => openTransferDialog(h)}
                          disabled={actionLoading}
                        >
                          Update Transfer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1"
                          onClick={() => openChecklistDialog(h)}
                          disabled={actionLoading}
                        >
                          <ClipboardCheck className="h-3 w-3" />
                          Checklist
                        </Button>
                      </>
                    )}
                    {h.status === "Completed" && h.signOffStatus === "Pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1 border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => handleAcceptSignOff(h)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Accept Sign-off
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1 border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => openRejectDialog(h)}
                          disabled={actionLoading}
                        >
                          <XCircle className="h-3 w-3" />
                          Reject Sign-off
                        </Button>
                      </>
                    )}
                    {(h.status === "Completed" || h.status === "Accepted") && h.signOffStatus === "Pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => openChecklistDialog(h)}
                        disabled={actionLoading}
                      >
                        <ClipboardCheck className="h-3 w-3" />
                        Checklist
                      </Button>
                    )}
                    {h.status !== "Planned" && h.status !== "InProgress" && h.signOffStatus !== "Pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => openChecklistDialog(h)}
                      >
                        <ClipboardCheck className="h-3 w-3" />
                        View Checklist
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[10px] ml-auto"
                      onClick={() => openDetailDialog(h)}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ─── Create Handover Dialog ─── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">New Admin Handover</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Select value={formCountry} onValueChange={(v) => setFormCountry(v ?? "Kenya")}>
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
                <Label className="text-xs">Handover Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v ?? "FullHandover")}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FullHandover">Full Handover</SelectItem>
                    <SelectItem value="PartialHandover">Partial Handover</SelectItem>
                    <SelectItem value="RoleTransition">Role Transition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Planned Date</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={formPlannedDate}
                onChange={(e) => setFormPlannedDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">From Person</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Name"
                  value={formFromPerson}
                  onChange={(e) => setFormFromPerson(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">From Email</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="email@example.com"
                  value={formFromEmail}
                  onChange={(e) => setFormFromEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">To Person</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Name"
                  value={formToPerson}
                  onChange={(e) => setFormToPerson(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To Email</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="email@example.com"
                  value={formToEmail}
                  onChange={(e) => setFormToEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                className="text-xs min-h-[60px]"
                placeholder="Additional notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              A default checklist with {DEFAULT_CHECKLIST.length} items will be created automatically.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={submitting || !formFromPerson || !formToPerson || !formPlannedDate}
            >
              {submitting ? "Creating..." : "Create Handover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ─── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Handover Details</DialogTitle>
          </DialogHeader>
          {selectedHandover && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">Country</p>
                  <p className="font-medium">
                    {COUNTRY_FLAGS[selectedHandover.country] || ""} {selectedHandover.country}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Handover Type</p>
                  <p className="font-medium">
                    {HANDOVER_TYPE_LABELS[selectedHandover.handoverType] || selectedHandover.handoverType}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] h-4 px-1.5 border",
                      HANDOVER_STATUS_COLORS[selectedHandover.status] || HANDOVER_STATUS_COLORS.Planned
                    )}
                  >
                    {selectedHandover.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Sign-off Status</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] h-4 px-1.5 border",
                      SIGNOFF_STATUS_COLORS[selectedHandover.signOffStatus] || SIGNOFF_STATUS_COLORS.Pending
                    )}
                  >
                    {selectedHandover.signOffStatus}
                  </Badge>
                </div>
              </div>

              {/* People */}
              <div className="border rounded-lg p-3">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">PEOPLE</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium">{selectedHandover.fromPerson}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedHandover.fromPersonEmail || "No email"}
                    </p>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 mt-1 bg-blue-50 text-blue-700 border-blue-200">
                      From
                    </Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{selectedHandover.toPerson}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedHandover.toPersonEmail || "No email"}
                    </p>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 mt-1 bg-green-50 text-green-700 border-green-200">
                      To
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">Planned Date</p>
                  <p className="font-medium">{formatDate(selectedHandover.plannedDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Completed Date</p>
                  <p className="font-medium">{formatDate(selectedHandover.completedDate)}</p>
                </div>
              </div>

              {/* Checklist Progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-medium text-muted-foreground">CHECKLIST PROGRESS</p>
                  <span className="text-[10px] font-medium">
                    {selectedHandover.completedItems}/{selectedHandover.totalItems}
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      getProgressColor(getProgressPercent(selectedHandover))
                    )}
                    style={{ width: `${getProgressPercent(selectedHandover)}%` }}
                  />
                </div>
              </div>

              {/* Checklist Items */}
              {(() => {
                const items = parseChecklist(selectedHandover.checklistItems);
                if (items.length === 0) return null;
                return (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">CHECKLIST ITEMS</p>
                    <div className="space-y-1">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded text-xs",
                            item.completed ? "bg-green-50" : "bg-muted/50"
                          )}
                        >
                          {item.completed ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-gray-300 shrink-0" />
                          )}
                          <span className={cn(item.completed && "line-through text-muted-foreground")}>
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Transfer Statuses */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-2">TRANSFER STATUSES</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Knowledge", status: selectedHandover.knowledgeTransferStatus },
                    { label: "Documentation", status: selectedHandover.documentationStatus },
                    { label: "Access", status: selectedHandover.accessTransferStatus },
                  ].map((transfer) => {
                    const TIcon = TRANSFER_STATUS_ICONS[transfer.status] || Clock;
                    const tColor = TRANSFER_STATUS_COLORS[transfer.status] || TRANSFER_STATUS_COLORS.NotStarted;
                    return (
                      <div
                        key={transfer.label}
                        className={cn("rounded-md px-2 py-2 border text-center", tColor)}
                      >
                        <TIcon className="h-4 w-4 mx-auto mb-1" />
                        <p className="text-[10px] font-medium">{transfer.label}</p>
                        <p className="text-[9px] opacity-75">
                          {transfer.status === "NotStarted"
                            ? "Not Started"
                            : transfer.status === "InProgress"
                            ? "In Progress"
                            : "Completed"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sign-off Info */}
              {(selectedHandover.signOffBy || selectedHandover.signOffAt) && (
                <div className="border rounded-lg p-3 text-xs">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">SIGN-OFF INFO</p>
                  {selectedHandover.signOffBy && (
                    <p>By: {selectedHandover.signOffBy}</p>
                  )}
                  {selectedHandover.signOffAt && (
                    <p>At: {formatDate(selectedHandover.signOffAt)}</p>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedHandover.notes && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">NOTES</p>
                  <p className="text-xs bg-muted/50 rounded p-2">{selectedHandover.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Transfer Status Dialog ─── */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Update Transfer Statuses</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Knowledge Transfer</Label>
              <Select value={formKnowledgeStatus} onValueChange={(v) => setFormKnowledgeStatus(v ?? "NotStarted")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NotStarted">Not Started</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Documentation Status</Label>
              <Select value={formDocumentationStatus} onValueChange={(v) => setFormDocumentationStatus(v ?? "NotStarted")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NotStarted">Not Started</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Access Transfer</Label>
              <Select value={formAccessStatus} onValueChange={(v) => setFormAccessStatus(v ?? "NotStarted")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NotStarted">Not Started</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdateTransfer} disabled={actionLoading}>
              {actionLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Checklist Dialog ─── */}
      <Dialog open={checklistDialogOpen} onOpenChange={setChecklistDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Update Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {formChecklistItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No checklist items defined for this handover.
              </p>
            ) : (
              formChecklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                    item.completed ? "bg-green-50 hover:bg-green-100" : "bg-muted/50 hover:bg-muted"
                  )}
                  onClick={() => toggleChecklistItem(idx)}
                >
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className={cn("text-xs", item.completed && "line-through text-muted-foreground")}>
                    {item.title}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[10px] text-muted-foreground">
              {formChecklistItems.filter((i) => i.completed).length} of {formChecklistItems.length} completed
            </span>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setChecklistDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdateChecklist} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save Checklist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Sign-off Dialog ─── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Reject Sign-off</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Please provide a reason for rejecting this handover sign-off.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Rejection Reason</Label>
              <Textarea
                className="text-xs min-h-[80px]"
                placeholder="Enter reason for rejection..."
                value={formRejectNotes}
                onChange={(e) => setFormRejectNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectSignOff}
              disabled={actionLoading}
            >
              {actionLoading ? "Rejecting..." : "Reject Sign-off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
