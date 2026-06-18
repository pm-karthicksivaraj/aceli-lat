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
  Ticket,
  AlertCircle,
  UserPlus,
  ArrowUp,
  CheckCircle,
  Clock,
  MessageSquare,
  Plus,
  ExternalLink,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TicketStatus =
  | "Open"
  | "Assigned"
  | "InProgress"
  | "WaitingOnUser"
  | "Resolved"
  | "Closed";

type TicketPriority = "Low" | "Normal" | "High" | "Urgent";

type TicketCategory =
  | "Technical"
  | "Access"
  | "Data"
  | "Integration"
  | "Training"
  | "Workflow"
  | "Other";

type AssignedTeam = "Level1" | "Level2" | "Engineering" | "Salesforce" | "Admin";

type Country = "Kenya" | "Uganda" | "Tanzania" | "Ethiopia" | "Nigeria";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  country: string;
  reportedBy: string;
  reportedByEmail: string | null;
  assignedTo: string | null;
  assignedToEmail: string | null;
  assignedTeam: string | null;
  lenderId: string | null;
  meetingId: string | null;
  screenUrl: string | null;
  stepsToReproduce: string | null;
  workaround: string | null;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  satisfactionScore: number | null;
  escalationLevel: number;
  escalatedAt: string | null;
  dueByDate: string | null;
  firstResponseAt: string | null;
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

const COUNTRIES: Country[] = [
  "Kenya",
  "Uganda",
  "Tanzania",
  "Ethiopia",
  "Nigeria",
];

const COUNTRY_FLAGS: Record<Country, string> = {
  Kenya: "\u{1F1F0}\u{1F1EA}",
  Uganda: "\u{1F1FA}\u{1F1EC}",
  Tanzania: "\u{1F1F9}\u{1F1FF}",
  Ethiopia: "\u{1F1EA}\u{1F1F9}",
  Nigeria: "\u{1F1F3}\u{1F1EC}",
};

const STATUS_OPTIONS: TicketStatus[] = [
  "Open",
  "Assigned",
  "InProgress",
  "WaitingOnUser",
  "Resolved",
  "Closed",
];

const PRIORITY_OPTIONS: TicketPriority[] = ["Low", "Normal", "High", "Urgent"];

const CATEGORY_OPTIONS: TicketCategory[] = [
  "Technical",
  "Access",
  "Data",
  "Integration",
  "Training",
  "Workflow",
  "Other",
];

const TEAM_OPTIONS: AssignedTeam[] = [
  "Level1",
  "Level2",
  "Engineering",
  "Salesforce",
  "Admin",
];

const PRIORITY_BADGE_COLORS: Record<TicketPriority, string> = {
  Urgent: "bg-red-100 text-red-800 border-red-300",
  High: "bg-orange-100 text-orange-800 border-orange-300",
  Normal: "bg-blue-100 text-blue-800 border-blue-300",
  Low: "bg-gray-100 text-gray-800 border-gray-300",
};

const STATUS_BADGE_COLORS: Record<TicketStatus, string> = {
  Open: "bg-red-100 text-red-800 border-red-300",
  Assigned: "bg-yellow-100 text-yellow-800 border-yellow-300",
  InProgress: "bg-blue-100 text-blue-800 border-blue-300",
  WaitingOnUser: "bg-orange-100 text-orange-800 border-orange-300",
  Resolved: "bg-green-100 text-green-800 border-green-300",
  Closed: "bg-green-100 text-green-800 border-green-300",
};

const CATEGORY_COLORS: Record<TicketCategory, string> = {
  Technical: "bg-purple-100 text-purple-800",
  Access: "bg-red-100 text-red-800",
  Data: "bg-amber-100 text-amber-800",
  Integration: "bg-blue-100 text-blue-800",
  Training: "bg-green-100 text-green-800",
  Workflow: "bg-cyan-100 text-cyan-800",
  Other: "bg-gray-100 text-gray-800",
};

const TEAM_LABELS: Record<AssignedTeam, string> = {
  Level1: "Level 1 Support",
  Level2: "Level 2 Support",
  Engineering: "Engineering",
  Salesforce: "Salesforce Team",
  Admin: "Admin",
};

const ESCALATION_TEAM_MAP: Record<number, AssignedTeam> = {
  0: "Level1",
  1: "Level2",
  2: "Engineering",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function SupportTicketBoard() {
  // Data state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  // Detail dialog
  const [detailTicket, setDetailTicket] = useState<SupportTicket | null>(null);

  // Assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const [assignToEmail, setAssignToEmail] = useState("");
  const [assignTeam, setAssignTeam] = useState<string>("Level1");

  // Resolve dialog
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveTicketId, setResolveTicketId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Technical");
  const [formPriority, setFormPriority] = useState<string>("Normal");
  const [formCountry, setFormCountry] = useState<string>("Kenya");
  const [formReportedBy, setFormReportedBy] = useState("");
  const [formReportedByEmail, setFormReportedByEmail] = useState("");
  const [formScreenUrl, setFormScreenUrl] = useState("");
  const [formStepsToReproduce, setFormStepsToReproduce] = useState("");

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ─── Fetch tickets ──────────────────────────────────────────────────────

  const fetchTickets = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);
    if (teamFilter !== "all") params.set("assignedTeam", teamFilter);

    fetch(`/api/support/tickets?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setTickets(json.data || []);
          if (json.pagination) {
            setPagination(json.pagination);
          }
        }
      })
      .catch(() => {
        // Error fetching tickets
      })
      .finally(() => setLoading(false));
  }, [
    pagination.page,
    pagination.pageSize,
    statusFilter,
    priorityFilter,
    categoryFilter,
    countryFilter,
    teamFilter,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);
    if (teamFilter !== "all") params.set("assignedTeam", teamFilter);

    fetch(`/api/support/tickets?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setTickets(json.data || []);
          if (json.pagination) {
            setPagination(json.pagination);
          }
        }
      })
      .catch(() => {
        // Error fetching tickets
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [
    pagination.page,
    pagination.pageSize,
    statusFilter,
    priorityFilter,
    categoryFilter,
    countryFilter,
    teamFilter,
  ]);

  // ─── Summary stats ─────────────────────────────────────────────────────

  const openCount = tickets.filter(
    (t) => t.status === "Open" || t.status === "Assigned"
  ).length;

  const inProgressCount = tickets.filter(
    (t) => t.status === "InProgress" || t.status === "WaitingOnUser"
  ).length;

  const resolvedThisWeek = tickets.filter((t) => {
    if (t.status !== "Resolved" && t.status !== "Closed") return false;
    if (!t.resolvedAt) return false;
    const resolvedDate = new Date(t.resolvedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return resolvedDate >= weekAgo;
  }).length;

  const avgResolutionMs = tickets
    .filter((t) => t.resolvedAt && t.createdAt)
    .reduce((acc, t) => {
      const diff =
        new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime();
      return acc + diff;
    }, 0);

  const resolvedWithTime = tickets.filter(
    (t) => t.resolvedAt && t.createdAt
  ).length;
  const avgResolutionHours =
    resolvedWithTime > 0
      ? Math.round((avgResolutionMs / resolvedWithTime / 3600000) * 10) / 10
      : 0;

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (!assignTicketId) return;
    setProcessing(true);
    try {
      await fetch(`/api/support/tickets/${assignTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          assignedTo: assignTo || null,
          assignedToEmail: assignToEmail || null,
          assignedTeam: assignTeam,
          status: "Assigned",
          firstResponseAt: new Date().toISOString(),
        }),
      });
      setAssignDialogOpen(false);
      setAssignTicketId(null);
      setAssignTo("");
      setAssignToEmail("");
      setAssignTeam("Level1");
      fetchTickets();
    } catch (error) {
      console.error("Error assigning ticket:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleEscalate = async (ticket: SupportTicket) => {
    setProcessing(true);
    try {
      const currentLevel = ticket.escalationLevel ?? 0;
      const nextLevel = currentLevel + 1;
      const nextTeam =
        ESCALATION_TEAM_MAP[nextLevel] || "Engineering";

      await fetch(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "escalate",
          escalationLevel: nextLevel,
          escalatedAt: new Date().toISOString(),
          assignedTeam: nextTeam,
        }),
      });
      fetchTickets();
    } catch (error) {
      console.error("Error escalating ticket:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveTicketId) return;
    setProcessing(true);
    try {
      await fetch(`/api/support/tickets/${resolveTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          status: "Resolved",
          resolution: resolution,
          resolvedBy: "admin",
          resolvedAt: new Date().toISOString(),
        }),
      });
      setResolveDialogOpen(false);
      setResolveTicketId(null);
      setResolution("");
      fetchTickets();
    } catch (error) {
      console.error("Error resolving ticket:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreate = async () => {
    if (!formTitle || !formDescription || !formCategory || !formCountry || !formReportedBy) {
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          priority: formPriority,
          country: formCountry,
          reportedBy: formReportedBy,
          reportedByEmail: formReportedByEmail || undefined,
          screenUrl: formScreenUrl || undefined,
          stepsToReproduce: formStepsToReproduce || undefined,
        }),
      });
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("Technical");
    setFormPriority("Normal");
    setFormCountry("Kenya");
    setFormReportedBy("");
    setFormReportedByEmail("");
    setFormScreenUrl("");
    setFormStepsToReproduce("");
  };

  const openAssignDialog = (ticket: SupportTicket) => {
    setAssignTicketId(ticket.id);
    setAssignTo(ticket.assignedTo ?? "");
    setAssignToEmail(ticket.assignedToEmail ?? "");
    setAssignTeam(ticket.assignedTeam ?? "Level1");
    setAssignDialogOpen(true);
  };

  const openResolveDialog = (ticket: SupportTicket) => {
    setResolveTicketId(ticket.id);
    setResolution(ticket.resolution ?? "");
    setResolveDialogOpen(true);
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

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEscalationLabel = (level: number) => {
    switch (level) {
      case 0:
        return "L1";
      case 1:
        return "L2";
      case 2:
        return "Eng";
      default:
        return `L${level}`;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Support Ticket Board</h2>
          <Badge variant="outline" className="text-xs">
            {pagination.total} ticket{pagination.total !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Ticket
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Open Tickets</span>
            </div>
            <p className="text-2xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">In Progress</span>
            </div>
            <p className="text-2xl font-bold">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">
                Resolved This Week
              </span>
            </div>
            <p className="text-2xl font-bold">{resolvedThisWeek}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                Avg Resolution
              </span>
            </div>
            <p className="text-2xl font-bold">
              {avgResolutionHours}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                hrs
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "WaitingOnUser" ? "Waiting on User" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(v) => { setPriorityFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => { setCategoryFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={countryFilter}
          onValueChange={(v) => { setCountryFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
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

        <Select
          value={teamFilter}
          onValueChange={(v) => { setTeamFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Assigned Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {TEAM_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {TEAM_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ticket Table */}
      <Card className="border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Ticket #
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Title
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Category
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Priority
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Country
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Reported By
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Assigned To
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Escalation
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Created
                  </th>
                  <th className="text-left font-medium py-2.5 px-3 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 animate-pulse" />
                        Loading tickets...
                      </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-muted-foreground">
                      No support tickets found
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setDetailTicket(ticket)}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] font-medium whitespace-nowrap">
                        {ticket.ticketNumber}
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate font-medium whitespace-nowrap">
                        {ticket.title}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] h-5 px-1.5",
                            CATEGORY_COLORS[ticket.category as TicketCategory] ||
                              "bg-gray-100 text-gray-800"
                          )}
                        >
                          {ticket.category}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-1.5 border",
                            PRIORITY_BADGE_COLORS[
                              ticket.priority as TicketPriority
                            ] || PRIORITY_BADGE_COLORS.Normal
                          )}
                        >
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-1.5 border",
                            STATUS_BADGE_COLORS[ticket.status as TicketStatus] ||
                              "bg-gray-100 text-gray-800"
                          )}
                        >
                          {ticket.status === "WaitingOnUser"
                            ? "Waiting"
                            : ticket.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <span className="text-sm">
                            {COUNTRY_FLAGS[ticket.country as Country] || ""}
                          </span>
                          {ticket.country}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                        {ticket.reportedBy}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                        {ticket.assignedTo || "\u2014"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-1.5",
                            ticket.escalationLevel >= 2
                              ? "bg-red-50 text-red-700 border-red-200"
                              : ticket.escalationLevel >= 1
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                          )}
                        >
                          {getEscalationLabel(ticket.escalationLevel)}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(ticket.status === "Open" ||
                            !ticket.assignedTo) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[10px] gap-0.5"
                              onClick={() => openAssignDialog(ticket)}
                              title="Assign"
                            >
                              <UserPlus className="h-3 w-3" />
                              <span className="hidden sm:inline">Assign</span>
                            </Button>
                          )}
                          {ticket.status !== "Resolved" &&
                            ticket.status !== "Closed" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px] gap-0.5"
                                  onClick={() => handleEscalate(ticket)}
                                  disabled={processing}
                                  title="Escalate"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                  <span className="hidden sm:inline">
                                    Escalate
                                  </span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px] gap-0.5"
                                  onClick={() => openResolveDialog(ticket)}
                                  title="Resolve"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span className="hidden sm:inline">
                                    Resolve
                                  </span>
                                </Button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}
            {"\u2013"}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            of {pagination.total} tickets
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            {Array.from(
              { length: Math.min(pagination.totalPages, 5) },
              (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pagination.page === pageNum ? "default" : "outline"
                    }
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: pageNum }))
                    }
                  >
                    {pageNum}
                  </Button>
                );
              }
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ─── Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={!!detailTicket}
        onOpenChange={() => setDetailTicket(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {detailTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {detailTicket.ticketNumber}
                  </span>
                  {detailTicket.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Badges row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 px-1.5 border",
                      STATUS_BADGE_COLORS[
                        detailTicket.status as TicketStatus
                      ] || "bg-gray-100 text-gray-800"
                    )}
                  >
                    {detailTicket.status === "WaitingOnUser"
                      ? "Waiting on User"
                      : detailTicket.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 px-1.5 border",
                      PRIORITY_BADGE_COLORS[
                        detailTicket.priority as TicketPriority
                      ] || PRIORITY_BADGE_COLORS.Normal
                    )}
                  >
                    {detailTicket.priority} Priority
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] h-5 px-1.5",
                      CATEGORY_COLORS[
                        detailTicket.category as TicketCategory
                      ] || "bg-gray-100 text-gray-800"
                    )}
                  >
                    {detailTicket.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 px-1.5",
                      detailTicket.escalationLevel >= 2
                        ? "bg-red-50 text-red-700 border-red-200"
                        : detailTicket.escalationLevel >= 1
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                    )}
                  >
                    Escalation: {detailTicket.escalationLevel}
                  </Badge>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Description
                  </p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {detailTicket.description}
                  </p>
                </div>

                {/* Steps to Reproduce */}
                {detailTicket.stepsToReproduce && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Steps to Reproduce
                    </p>
                    <p className="text-xs leading-relaxed bg-muted p-2.5 rounded whitespace-pre-wrap">
                      {detailTicket.stepsToReproduce}
                    </p>
                  </div>
                )}

                {/* Workaround */}
                {detailTicket.workaround && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Workaround
                    </p>
                    <p className="text-xs leading-relaxed bg-amber-50 p-2.5 rounded text-amber-900 whitespace-pre-wrap">
                      {detailTicket.workaround}
                    </p>
                  </div>
                )}

                {/* Resolution */}
                {detailTicket.resolution && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Resolution
                    </p>
                    <p className="text-xs leading-relaxed bg-green-50 p-2.5 rounded text-green-900 whitespace-pre-wrap">
                      {detailTicket.resolution}
                    </p>
                  </div>
                )}

                {/* Satisfaction */}
                {detailTicket.satisfactionScore !== null &&
                  detailTicket.satisfactionScore !== undefined && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        Satisfaction Score
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={cn(
                              "text-lg",
                              star <= detailTicket.satisfactionScore!
                                ? "text-amber-400"
                                : "text-gray-200"
                            )}
                          >
                            {"\u2605"}
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({detailTicket.satisfactionScore}/5)
                        </span>
                      </div>
                    </div>
                  )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Country:</span>{" "}
                    {COUNTRY_FLAGS[detailTicket.country as Country] || ""}{" "}
                    {detailTicket.country}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      Reported By:
                    </span>{" "}
                    {detailTicket.reportedBy}
                    {detailTicket.reportedByEmail && (
                      <span className="ml-1">
                        ({detailTicket.reportedByEmail})
                      </span>
                    )}
                  </div>
                  {detailTicket.assignedTo && (
                    <div>
                      <span className="font-medium text-foreground">
                        Assigned To:
                      </span>{" "}
                      {detailTicket.assignedTo}
                      {detailTicket.assignedToEmail && (
                        <span className="ml-1">
                          ({detailTicket.assignedToEmail})
                        </span>
                      )}
                    </div>
                  )}
                  {detailTicket.assignedTeam && (
                    <div>
                      <span className="font-medium text-foreground">
                        Team:
                      </span>{" "}
                      {TEAM_LABELS[detailTicket.assignedTeam as AssignedTeam] ||
                        detailTicket.assignedTeam}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-foreground">
                      Created:
                    </span>{" "}
                    {formatDateTime(detailTicket.createdAt)}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      First Response:
                    </span>{" "}
                    {formatDateTime(detailTicket.firstResponseAt)}
                  </div>
                  {detailTicket.resolvedAt && (
                    <div>
                      <span className="font-medium text-foreground">
                        Resolved:
                      </span>{" "}
                      {formatDateTime(detailTicket.resolvedAt)}
                    </div>
                  )}
                  {detailTicket.resolvedBy && (
                    <div>
                      <span className="font-medium text-foreground">
                        Resolved By:
                      </span>{" "}
                      {detailTicket.resolvedBy}
                    </div>
                  )}
                  {detailTicket.escalatedAt && (
                    <div>
                      <span className="font-medium text-foreground">
                        Escalated:
                      </span>{" "}
                      {formatDateTime(detailTicket.escalatedAt)}
                    </div>
                  )}
                  {detailTicket.screenUrl && (
                    <div className="col-span-2">
                      <span className="font-medium text-foreground">
                        Screen:
                      </span>{" "}
                      <span className="inline-flex items-center gap-0.5 text-blue-600">
                        {detailTicket.screenUrl}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons in Detail */}
                {detailTicket.status !== "Resolved" &&
                  detailTicket.status !== "Closed" && (
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      {(!detailTicket.assignedTo ||
                        detailTicket.status === "Open") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1"
                          onClick={() => {
                            openAssignDialog(detailTicket);
                            setDetailTicket(null);
                          }}
                        >
                          <UserPlus className="h-3 w-3" />
                          Assign
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => {
                          handleEscalate(detailTicket);
                          setDetailTicket(null);
                        }}
                        disabled={processing}
                      >
                        <ArrowUp className="h-3 w-3" />
                        Escalate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => {
                          openResolveDialog(detailTicket);
                          setDetailTicket(null);
                        }}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Resolve
                      </Button>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Assign Dialog ──────────────────────────────────────────────── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Assign Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Assigned Team</Label>
              <Select
                value={assignTeam}
                onValueChange={(v) => setAssignTeam(v ?? "Level1")}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TEAM_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Assignee Name</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Enter assignee name"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Assignee Email</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Enter assignee email"
                type="email"
                value={assignToEmail}
                onChange={(e) => setAssignToEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleAssign}
              disabled={processing}
            >
              {processing ? "Assigning..." : "Assign Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Resolve Dialog ─────────────────────────────────────────────── */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Resolve Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Resolution Notes</Label>
              <Textarea
                className="text-xs min-h-[100px]"
                placeholder="Describe the resolution..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setResolveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleResolve}
              disabled={processing || !resolution.trim()}
            >
              {processing ? "Resolving..." : "Resolve Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Ticket Dialog ───────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="Brief description of the issue"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                className="text-xs min-h-[80px]"
                placeholder="Detailed description of the issue"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formCategory}
                  onValueChange={(v) => setFormCategory(v ?? "Technical")}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Priority</Label>
                <Select
                  value={formPriority}
                  onValueChange={(v) => setFormPriority(v ?? "Normal")}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formCountry}
                onValueChange={(v) => setFormCountry(v ?? "Kenya")}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Country" />
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">
                  Reported By <span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Name"
                  value={formReportedBy}
                  onChange={(e) => setFormReportedBy(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Reporter Email</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="email@example.com"
                  type="email"
                  value={formReportedByEmail}
                  onChange={(e) => setFormReportedByEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Screen URL</Label>
              <Input
                className="h-8 text-xs"
                placeholder="/meetings, /lenders, etc."
                value={formScreenUrl}
                onChange={(e) => setFormScreenUrl(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Steps to Reproduce</Label>
              <Textarea
                className="text-xs min-h-[60px]"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                value={formStepsToReproduce}
                onChange={(e) => setFormStepsToReproduce(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleCreate}
              disabled={
                submitting ||
                !formTitle.trim() ||
                !formDescription.trim() ||
                !formCategory ||
                !formCountry ||
                !formReportedBy.trim()
              }
            >
              {submitting ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
