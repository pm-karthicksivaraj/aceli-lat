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
  Settings, Shield, Users, Globe, Activity, ClipboardList,
  ChevronRight, Plus, AlertTriangle,
} from "lucide-react";

// ─── Constants ───

const ACTION_TYPES = [
  "ConfigurationChange",
  "UserManagement",
  "DataCorrection",
  "SystemOverride",
  "RoleAssignment",
  "ExportApproval",
  "FeatureToggle",
] as const;

const CATEGORIES = [
  "CountryConfig",
  "UserAdmin",
  "SystemConfig",
  "DataManagement",
  "Security",
] as const;

const IMPACT_LEVELS = ["Low", "Medium", "High", "Critical"] as const;

const COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  Kenya: "\u{1F1F0}\u{1F1EA}",
  Uganda: "\u{1F1FA}\u{1F1EC}",
  Tanzania: "\u{1F1F9}\u{1F1FF}",
  Ethiopia: "\u{1F1EA}\u{1F1F9}",
  Nigeria: "\u{1F1F3}\u{1F1EC}",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  ConfigurationChange: "Config Change",
  UserManagement: "User Mgmt",
  DataCorrection: "Data Correction",
  SystemOverride: "System Override",
  RoleAssignment: "Role Assignment",
  ExportApproval: "Export Approval",
  FeatureToggle: "Feature Toggle",
};

const CATEGORY_LABELS: Record<string, string> = {
  CountryConfig: "Country Config",
  UserAdmin: "User Admin",
  SystemConfig: "System Config",
  DataManagement: "Data Mgmt",
  Security: "Security",
};

const IMPACT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Critical: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  High: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  Medium: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  Low: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
};

const READINESS_STATUS_LABELS: Record<string, string> = {
  NotReady: "Not Ready",
  EarlyStage: "Early Stage",
  InProgress: "In Progress",
  NearlyReady: "Nearly Ready",
  Ready: "Ready",
};

const READINESS_STATUS_COLORS: Record<string, string> = {
  NotReady: "bg-red-100 text-red-800",
  EarlyStage: "bg-orange-100 text-orange-800",
  InProgress: "bg-yellow-100 text-yellow-800",
  NearlyReady: "bg-blue-100 text-blue-800",
  Ready: "bg-green-100 text-green-800",
};

const ROLLOUT_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-gray-100 text-gray-800",
  InProgress: "bg-blue-100 text-blue-800",
  Active: "bg-green-100 text-green-800",
  Suspended: "bg-red-100 text-red-800",
};

// ─── Types ───

interface AdminAction {
  id: string;
  actionType: string;
  category: string;
  performedBy: string;
  performedByEmail: string | null;
  targetEntity: string;
  targetEntityId: string | null;
  description: string;
  previousValue: string | null;
  newValue: string | null;
  country: string | null;
  justification: string | null;
  approvedBy: string | null;
  impact: string;
  rollbackPlan: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CountryReadiness {
  country: string;
  rolloutStatus: string;
  pilotCountry: boolean;
  goLiveDate: string | null;
  trainingStatus: string;
  dataMigrationStatus: string;
  roleSetupComplete: boolean;
  fieldOfficerCount: number;
  readinessScore: number;
  readinessStatus: string;
  trainingCompletionRate: number;
  totalTrained: number;
  totalTrainees: number;
  activeUsersThisWeek: number;
  totalUsersThisWeek: number;
  adoptionRate: number;
}

type TabType = "action-log" | "country-readiness" | "admin-actions";

// ─── Helpers ───

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatGoLiveDate(dateStr: string | null): string {
  if (!dateStr) return "Not set";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-blue-500";
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number): string {
  if (score >= 90) return "text-blue-700";
  if (score >= 70) return "text-green-700";
  if (score >= 50) return "text-yellow-700";
  return "text-red-700";
}

function getProgressBarBg(score: number): string {
  if (score >= 90) return "bg-blue-100";
  if (score >= 70) return "bg-green-100";
  if (score >= 50) return "bg-yellow-100";
  return "bg-red-100";
}

function tryFormatJson(value: string | null): string {
  if (!value) return "—";
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

// ─── Component ───

export function AdminToolkit() {
  const [activeTab, setActiveTab] = useState<TabType>("action-log");

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "action-log", label: "Action Log", icon: ClipboardList },
    { id: "country-readiness", label: "Country Readiness", icon: Globe },
    { id: "admin-actions", label: "Admin Actions", icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Admin Toolkit</h2>
          <p className="text-xs text-muted-foreground">
            System configuration, user management, and operational control
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "action-log" && <ActionLogTab />}
      {activeTab === "country-readiness" && <CountryReadinessTab />}
      {activeTab === "admin-actions" && <AdminActionsTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 1: ACTION LOG
// ═══════════════════════════════════════════════

function ActionLogTab() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Detail dialog
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);

  const fetchActions = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", "20");
        if (actionTypeFilter !== "all") params.set("actionType", actionTypeFilter);
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (countryFilter !== "all") params.set("country", countryFilter);

        const res = await fetch(`/api/admin/actions?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch actions");
        const data = await res.json();
        setActions(data.data || []);
        setPagination(
          data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [actionTypeFilter, categoryFilter, countryFilter]
  );

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("pageSize", "20");
        if (actionTypeFilter !== "all") params.set("actionType", actionTypeFilter);
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (countryFilter !== "all") params.set("country", countryFilter);

        const res = await fetch(`/api/admin/actions?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch actions");
        const data = await res.json();
        setActions(data.data || []);
        setPagination(
          data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 }
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [actionTypeFilter, categoryFilter, countryFilter]);

  const handlePageChange = (newPage: number) => {
    fetchActions(newPage);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Action Type
              </Label>
              <Select
                value={actionTypeFilter}
                onValueChange={(v) => setActionTypeFilter(v ?? "all")}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ACTION_TYPE_LABELS[t] || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Category
              </Label>
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v ?? "all")}
              >
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c] || c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Country
              </Label>
              <Select
                value={countryFilter}
                onValueChange={(v) => setCountryFilter(v ?? "all")}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {COUNTRY_FLAGS[c]} {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="Global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs ml-auto"
              onClick={() => fetchActions(pagination.page)}
            >
              <Activity className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Admin Action Log
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              {pagination.total} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ) : actions.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No admin actions found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust filters or create a new action
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium p-3 whitespace-nowrap">
                        Timestamp
                      </th>
                      <th className="text-left font-medium p-3 whitespace-nowrap">
                        Action Type
                      </th>
                      <th className="text-left font-medium p-3 whitespace-nowrap">
                        Category
                      </th>
                      <th className="text-left font-medium p-3 whitespace-nowrap">
                        Performed By
                      </th>
                      <th className="text-left font-medium p-3 whitespace-nowrap">
                        Target Entity
                      </th>
                      <th className="text-left font-medium p-3 whitespace-nowrap">
                        Country
                      </th>
                      <th className="text-left font-medium p-3 whitespace-nowrap">
                        Impact
                      </th>
                      <th className="text-left font-medium p-3 whitespace-nowrap">
                        Description
                      </th>
                      <th className="text-right font-medium p-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((action) => {
                      const impactStyle =
                        IMPACT_COLORS[action.impact] || IMPACT_COLORS.Low;
                      return (
                        <tr
                          key={action.id}
                          className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                          onClick={() => setSelectedAction(action)}
                        >
                          <td className="p-3 whitespace-nowrap text-muted-foreground">
                            {formatDate(action.createdAt)}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className="text-[9px] h-5 px-1.5"
                            >
                              {ACTION_TYPE_LABELS[action.actionType] ||
                                action.actionType}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className="text-[9px] h-5 px-1.5"
                            >
                              {CATEGORY_LABELS[action.category] ||
                                action.category}
                            </Badge>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span>{action.performedBy}</span>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {action.targetEntity}
                            {action.targetEntityId && (
                              <span className="text-muted-foreground ml-1">
                                ({action.targetEntityId})
                              </span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {action.country ? (
                              <span className="flex items-center gap-1">
                                <span>
                                  {COUNTRY_FLAGS[action.country] || ""}
                                </span>
                                {action.country}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Global
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] h-5 px-1.5 border",
                                impactStyle.bg,
                                impactStyle.text
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full mr-1 inline-block",
                                  impactStyle.dot
                                )}
                              />
                              {action.impact}
                            </Badge>
                          </td>
                          <td className="p-3 max-w-[200px] truncate">
                            {action.description}
                          </td>
                          <td className="p-3 text-right">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground inline-block" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-2 p-4">
                {actions.map((action) => {
                  const impactStyle =
                    IMPACT_COLORS[action.impact] || IMPACT_COLORS.Low;
                  return (
                    <Card
                      key={action.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedAction(action)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="text-[9px] h-5 px-1.5"
                            >
                              {ACTION_TYPE_LABELS[action.actionType] ||
                                action.actionType}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] h-5 px-1.5 border",
                                impactStyle.bg,
                                impactStyle.text
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full mr-1 inline-block",
                                  impactStyle.dot
                                )}
                              />
                              {action.impact}
                            </Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                        <p className="text-xs text-foreground mb-1.5 line-clamp-2">
                          {action.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{action.performedBy}</span>
                          <span>
                            {action.country
                              ? `${COUNTRY_FLAGS[action.country] || ""} ${action.country}`
                              : "Global"}
                          </span>
                          <span>{formatDate(action.createdAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
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
                } else if (
                  pagination.page >=
                  pagination.totalPages - 2
                ) {
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
                    className={cn(
                      "h-7 w-7 text-xs p-0",
                      pagination.page === pageNum && "pointer-events-none"
                    )}
                    onClick={() => handlePageChange(pageNum)}
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
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action Detail Dialog */}
      <Dialog
        open={!!selectedAction}
        onOpenChange={(open) => !open && setSelectedAction(null)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Action Details
            </DialogTitle>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4 text-xs">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground mb-0.5">Action Type</p>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                    {ACTION_TYPE_LABELS[selectedAction.actionType] ||
                      selectedAction.actionType}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Category</p>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                    {CATEGORY_LABELS[selectedAction.category] ||
                      selectedAction.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Impact</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 px-1.5 border",
                      IMPACT_COLORS[selectedAction.impact]?.bg,
                      IMPACT_COLORS[selectedAction.impact]?.text
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full mr-1 inline-block",
                        IMPACT_COLORS[selectedAction.impact]?.dot
                      )}
                    />
                    {selectedAction.impact}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Country</p>
                  <span>
                    {selectedAction.country
                      ? `${COUNTRY_FLAGS[selectedAction.country] || ""} ${selectedAction.country}`
                      : "Global"}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Performed By</p>
                  <span>{selectedAction.performedBy}</span>
                  {selectedAction.performedByEmail && (
                    <p className="text-muted-foreground text-[10px]">
                      {selectedAction.performedByEmail}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Timestamp</p>
                  <span>{formatDate(selectedAction.createdAt)}</span>
                </div>
              </div>

              {/* Target */}
              <div>
                <p className="text-muted-foreground mb-0.5">Target Entity</p>
                <span>
                  {selectedAction.targetEntity}
                  {selectedAction.targetEntityId && (
                    <span className="text-muted-foreground ml-1">
                      ({selectedAction.targetEntityId})
                    </span>
                  )}
                </span>
              </div>

              {/* Description */}
              <div>
                <p className="text-muted-foreground mb-0.5">Description</p>
                <p className="bg-muted/50 p-2 rounded text-foreground leading-relaxed">
                  {selectedAction.description}
                </p>
              </div>

              {/* Previous / New Value */}
              {(selectedAction.previousValue || selectedAction.newValue) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground mb-0.5">
                      Previous Value
                    </p>
                    <pre className="bg-red-50 text-red-800 p-2 rounded text-[10px] overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {tryFormatJson(selectedAction.previousValue)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">New Value</p>
                    <pre className="bg-green-50 text-green-800 p-2 rounded text-[10px] overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {tryFormatJson(selectedAction.newValue)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Justification */}
              {selectedAction.justification && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Justification</p>
                  <p className="bg-muted/50 p-2 rounded">
                    {selectedAction.justification}
                  </p>
                </div>
              )}

              {/* Approved By */}
              {selectedAction.approvedBy && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Approved By</p>
                  <span>{selectedAction.approvedBy}</span>
                </div>
              )}

              {/* Rollback Plan */}
              {selectedAction.rollbackPlan && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Rollback Plan</p>
                  <p className="bg-amber-50 text-amber-800 p-2 rounded">
                    {selectedAction.rollbackPlan}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAction(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 2: COUNTRY READINESS
// ═══════════════════════════════════════════════

function CountryReadinessTab() {
  const [readinessData, setReadinessData] = useState<CountryReadiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/rollout/country-readiness", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch readiness data");
        return res.json();
      })
      .then((data) => {
        setReadinessData(data.data || []);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const wave2Ready = readinessData.filter(
    (c) =>
      !c.pilotCountry &&
      (c.readinessStatus === "Ready" || c.readinessStatus === "NearlyReady")
  );

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      {!loading && !error && readinessData.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Rollout Wave 2 Readiness
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {wave2Ready.length > 0 ? (
                    <>
                      <span className="font-medium text-green-700">
                        {wave2Ready.length}{" "}
                        {wave2Ready.length === 1 ? "country" : "countries"}
                      </span>{" "}
                      ready for Wave 2 rollout:{" "}
                      {wave2Ready.map((c) => c.country).join(", ")}
                    </>
                  ) : (
                    "No countries are currently ready for Wave 2 rollout."
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-40 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Readiness Cards */}
      {!loading && !error && readinessData.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No country readiness data available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure country settings to see readiness scores
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && readinessData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {readinessData.map((country) => (
            <CountryReadinessCard key={country.country} data={country} />
          ))}
        </div>
      )}

      {/* Wave 2 Summary */}
      {!loading && readinessData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Rollout Wave Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {readinessData.map((country) => (
                <div
                  key={country.country}
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {COUNTRY_FLAGS[country.country] || ""}
                    </span>
                    <span className="text-xs font-medium">
                      {country.country}
                    </span>
                    {country.pilotCountry && (
                      <Badge className="text-[9px] h-4 px-1 bg-primary/10 text-primary border-primary/20">
                        Pilot
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] h-5 px-1.5",
                        ROLLOUT_STATUS_COLORS[country.rolloutStatus] ||
                          "bg-gray-100 text-gray-800"
                      )}
                    >
                      {country.rolloutStatus}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] h-5 px-1.5",
                        READINESS_STATUS_COLORS[country.readinessStatus] ||
                          "bg-gray-100 text-gray-800"
                      )}
                    >
                      {READINESS_STATUS_LABELS[country.readinessStatus] ||
                        country.readinessStatus}
                    </Badge>
                    <span
                      className={cn(
                        "text-xs font-bold min-w-[32px] text-right",
                        getScoreTextColor(country.readinessScore)
                      )}
                    >
                      {country.readinessScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CountryReadinessCard({ data }: { data: CountryReadiness }) {
  const scoreColor = getScoreColor(data.readinessScore);
  const progressBg = getProgressBarBg(data.readinessScore);
  const scoreTextColor = getScoreTextColor(data.readinessScore);

  return (
    <Card className="relative overflow-hidden">
      {data.pilotCountry && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl">
          PILOT
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-base">
            {COUNTRY_FLAGS[data.country] || ""}
          </span>
          {data.country}
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] h-5 px-1.5 ml-auto",
              ROLLOUT_STATUS_COLORS[data.rolloutStatus] ||
                "bg-gray-100 text-gray-800"
            )}
          >
            {data.rolloutStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {/* Readiness Score */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              Readiness Score
            </span>
            <span className={cn("text-lg font-bold", scoreTextColor)}>
              {data.readinessScore}
              <span className="text-[10px] text-muted-foreground font-normal">
                /100
              </span>
            </span>
          </div>
          <div className={cn("h-2 rounded-full", progressBg)}>
            <div
              className={cn("h-full rounded-full transition-all", scoreColor)}
              style={{ width: `${data.readinessScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] h-5 px-1.5",
                READINESS_STATUS_COLORS[data.readinessStatus] ||
                  "bg-gray-100 text-gray-800"
              )}
            >
              {READINESS_STATUS_LABELS[data.readinessStatus] ||
                data.readinessStatus}
            </Badge>
            {data.goLiveDate && (
              <span className="text-[10px] text-muted-foreground">
                Go-live: {formatGoLiveDate(data.goLiveDate)}
              </span>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Key Metrics
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <MetricItem
              label="Training Completion"
              value={`${data.trainingCompletionRate}%`}
            />
            <MetricItem
              label="Data Migration"
              value={data.dataMigrationStatus}
              status={data.dataMigrationStatus}
            />
            <MetricItem
              label="Role Setup"
              value={data.roleSetupComplete ? "Complete" : "Incomplete"}
              status={data.roleSetupComplete ? "Completed" : "Pending"}
            />
            <MetricItem
              label="Adoption Rate"
              value={`${data.adoptionRate}%`}
            />
            <MetricItem
              label="Active Users"
              value={`${data.activeUsersThisWeek}/${data.totalUsersThisWeek}`}
            />
            <MetricItem
              label="Field Officers"
              value={String(data.fieldOfficerCount)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: string;
}) {
  const statusColor =
    status === "Completed" || status === "Active"
      ? "text-green-700"
      : status === "InProgress"
        ? "text-yellow-700"
        : status === "Pending" || status === "Incomplete"
          ? "text-red-600"
          : "text-foreground";

  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-[10px] font-medium", statusColor)}>
        {value}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 3: ADMIN ACTIONS
// ═══════════════════════════════════════════════

function AdminActionsTab() {
  // Form state
  const [formActionType, setFormActionType] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formTargetEntity, setFormTargetEntity] = useState("");
  const [formTargetEntityId, setFormTargetEntityId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCountry, setFormCountry] = useState<string>("");
  const [formPreviousValue, setFormPreviousValue] = useState("");
  const [formNewValue, setFormNewValue] = useState("");
  const [formJustification, setFormJustification] = useState("");
  const [formApprovedBy, setFormApprovedBy] = useState("");
  const [formImpact, setFormImpact] = useState<string>("Low");
  const [formRollbackPlan, setFormRollbackPlan] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Recent actions
  const [recentActions, setRecentActions] = useState<AdminAction[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const fetchRecentActions = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await fetch("/api/admin/actions?pageSize=5");
      if (res.ok) {
        const data = await res.json();
        setRecentActions(data.data || []);
      }
    } catch {
      // Error
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setRecentLoading(true);
      try {
        const res = await fetch("/api/admin/actions?pageSize=5", { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setRecentActions(data.data || []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Error
      } finally {
        setRecentLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const resetForm = () => {
    setFormActionType("");
    setFormCategory("");
    setFormTargetEntity("");
    setFormTargetEntityId("");
    setFormDescription("");
    setFormCountry("");
    setFormPreviousValue("");
    setFormNewValue("");
    setFormJustification("");
    setFormApprovedBy("");
    setFormImpact("Low");
    setFormRollbackPlan("");
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!formActionType || !formCategory || !formTargetEntity || !formDescription) {
      setSubmitError(
        "Action Type, Category, Target Entity, and Description are required."
      );
      setSubmitting(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        actionType: formActionType,
        category: formCategory,
        performedBy: "admin",
        performedByEmail: "admin@aceli.org",
        targetEntity: formTargetEntity,
        description: formDescription,
        impact: formImpact,
      };

      if (formTargetEntityId.trim()) body.targetEntityId = formTargetEntityId.trim();
      if (formCountry && formCountry !== "Global")
        body.country = formCountry;
      if (formPreviousValue.trim()) body.previousValue = formPreviousValue.trim();
      if (formNewValue.trim()) body.newValue = formNewValue.trim();
      if (formJustification.trim()) body.justification = formJustification.trim();
      if (formApprovedBy.trim()) body.approvedBy = formApprovedBy.trim();
      if (formRollbackPlan.trim()) body.rollbackPlan = formRollbackPlan.trim();

      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create action");
      }

      setSubmitSuccess(true);
      resetForm();
      fetchRecentActions();

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create action"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {submitSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3 flex items-center gap-2">
            <span className="text-green-600 text-sm font-medium">
              Action created successfully!
            </span>
          </CardContent>
        </Card>
      )}

      {/* Create Action Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Admin Action
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Error */}
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {submitError}
            </div>
          )}

          {/* Row 1: Action Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Action Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formActionType}
                onValueChange={(v) => setFormActionType(v ?? "")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ACTION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formCategory}
                onValueChange={(v) => setFormCategory(v ?? "")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Target Entity & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Target Entity <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. CountryConfig"
                value={formTargetEntity}
                onChange={(e) => setFormTargetEntity(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Entity ID</Label>
              <Input
                placeholder="e.g. cfg-001"
                value={formTargetEntityId}
                onChange={(e) => setFormTargetEntityId(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Describe the admin action being performed..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="min-h-[60px] text-xs"
            />
          </div>

          {/* Row 4: Country & Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Country</Label>
              <Select
                value={formCountry}
                onValueChange={(v) => setFormCountry(v ?? "")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Global">Global</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {COUNTRY_FLAGS[c]} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Impact</Label>
              <Select
                value={formImpact}
                onValueChange={(v) => setFormImpact(v ?? "Low")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select impact" />
                </SelectTrigger>
                <SelectContent>
                  {IMPACT_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Previous Value & New Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Previous Value (JSON)</Label>
              <Textarea
                placeholder='{"key": "old_value"}'
                value={formPreviousValue}
                onChange={(e) => setFormPreviousValue(e.target.value)}
                className="min-h-[60px] text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New Value (JSON)</Label>
              <Textarea
                placeholder='{"key": "new_value"}'
                value={formNewValue}
                onChange={(e) => setFormNewValue(e.target.value)}
                className="min-h-[60px] text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 6: Justification */}
          <div className="space-y-1.5">
            <Label className="text-xs">Justification</Label>
            <Textarea
              placeholder="Why is this action being performed?"
              value={formJustification}
              onChange={(e) => setFormJustification(e.target.value)}
              className="min-h-[50px] text-xs"
            />
          </div>

          {/* Row 7: Approved By & Rollback Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Approved By</Label>
              <Input
                placeholder="e.g. cto@aceli.org"
                value={formApprovedBy}
                onChange={(e) => setFormApprovedBy(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rollback Plan</Label>
              <Textarea
                placeholder="How to undo this action..."
                value={formRollbackPlan}
                onChange={(e) => setFormRollbackPlan(e.target.value)}
                className="min-h-[50px] text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-xs"
            >
              {submitting ? (
                <>
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-1.5" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create Action
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="text-xs"
              disabled={submitting}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {recentLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ) : recentActions.length === 0 ? (
            <div className="text-center py-6">
              <ClipboardList className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">
                No recent admin actions
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentActions.map((action) => {
                const impactStyle =
                  IMPACT_COLORS[action.impact] || IMPACT_COLORS.Low;
                return (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        impactStyle.dot
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 px-1"
                        >
                          {ACTION_TYPE_LABELS[action.actionType] ||
                            action.actionType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] h-4 px-1 border",
                            impactStyle.bg,
                            impactStyle.text
                          )}
                        >
                          {action.impact}
                        </Badge>
                        {action.country && (
                          <span className="text-[10px] text-muted-foreground">
                            {COUNTRY_FLAGS[action.country]} {action.country}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground line-clamp-2">
                        {action.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>{action.performedBy}</span>
                        <span>&middot;</span>
                        <span>{formatDate(action.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
