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
  Briefcase,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Globe,
  FileText,
  Send,
  Archive,
  Sparkles,
  Shield,
  AlertTriangle,
  Users,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type PackStatus = "Draft" | "InReview" | "Approved" | "Published" | "Archived";
type Country = "Kenya" | "Uganda" | "Tanzania" | "Ethiopia" | "Nigeria";

interface ExecutiveReviewPack {
  id: string;
  packName: string;
  period: string;
  country: string;
  status: string;
  audience: string;
  sections: string;
  kpiSummary: string;
  highlights: string;
  risks: string;
  recommendations: string;
  actionItems: string;
  isPublished: boolean;
  generatedBy: string | null;
  generatedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
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

const PACK_STATUSES: PackStatus[] = ["Draft", "InReview", "Approved", "Published", "Archived"];
const AUDIENCE_OPTIONS = ["Board", "Executive Team", "Steering Committee", "Stakeholders", "Program Team"];
const PERIOD_OPTIONS = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "H1 2025", "H2 2025", "FY 2025"];

const STATUS_COLORS: Record<PackStatus, string> = {
  Draft: "bg-gray-100 text-gray-800 border-gray-300",
  InReview: "bg-blue-100 text-blue-800 border-blue-300",
  Approved: "bg-green-100 text-green-800 border-green-300",
  Published: "bg-purple-100 text-purple-800 border-purple-300",
  Archived: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ExecutiveReviewPacks() {
  // Data state
  const [packs, setPacks] = useState<ExecutiveReviewPack[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formPackName, setFormPackName] = useState("");
  const [formPeriod, setFormPeriod] = useState<string>("Q1 2025");
  const [formCountry, setFormCountry] = useState<string>("Kenya");
  const [formAudience, setFormAudience] = useState<string>("Executive Team");
  const [formSections, setFormSections] = useState("");

  // Detail dialog
  const [detailPack, setDetailPack] = useState<ExecutiveReviewPack | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ─── Fetch packs ────────────────────────────────────────────────────────

  const fetchPacks = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);
    if (periodFilter !== "all") params.set("period", periodFilter);
    if (audienceFilter !== "all") params.set("audience", audienceFilter);

    fetch(`/api/executive-review?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setPacks(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.pageSize, statusFilter, countryFilter, periodFilter, audienceFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);
    if (periodFilter !== "all") params.set("period", periodFilter);
    if (audienceFilter !== "all") params.set("audience", audienceFilter);

    fetch(`/api/executive-review?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setPacks(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [pagination.page, pagination.pageSize, statusFilter, countryFilter, periodFilter, audienceFilter]);

  // ─── Summary stats ─────────────────────────────────────────────────────

  const draftCount = packs.filter((p) => p.status === "Draft").length;
  const inReviewCount = packs.filter((p) => p.status === "InReview").length;
  const approvedCount = packs.filter((p) => p.status === "Approved").length;
  const publishedCount = packs.filter((p) => p.isPublished).length;

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formPackName || !formPeriod) return;
    setSubmitting(true);
    try {
      let sectionsData = "[]";
      if (formSections.trim()) {
        try {
          const parsed = JSON.parse(formSections);
          sectionsData = JSON.stringify(parsed);
        } catch {
          sectionsData = JSON.stringify(formSections.split("\n").filter((s) => s.trim()));
        }
      }

      await fetch("/api/executive-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packName: formPackName,
          period: formPeriod,
          country: formCountry,
          audience: formAudience,
          sections: sectionsData,
          kpiSummary: "[]",
          highlights: "[]",
          risks: "[]",
          recommendations: "[]",
          actionItems: "[]",
          status: "Draft",
          isPublished: false,
        }),
      });
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchPacks();
    } catch (error) {
      console.error("Error creating review pack:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormPackName("");
    setFormPeriod("Q1 2025");
    setFormCountry("Kenya");
    setFormAudience("Executive Team");
    setFormSections("");
  };

  const handleStatusChange = async (pack: ExecutiveReviewPack, newStatus: string, extraFields?: Record<string, unknown>) => {
    setProcessing(true);
    try {
      await fetch(`/api/executive-review/${pack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...extraFields,
        }),
      });
      fetchPacks();
    } catch (error) {
      console.error("Error updating pack:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async (pack: ExecutiveReviewPack) => {
    setProcessing(true);
    try {
      await fetch(`/api/executive-review/${pack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generatedBy: "admin",
          generatedAt: new Date().toISOString(),
        }),
      });
      fetchPacks();
    } catch (error) {
      console.error("Error generating pack:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReview = (pack: ExecutiveReviewPack) => {
    handleStatusChange(pack, "InReview", {
      reviewedBy: "admin",
      reviewedAt: new Date().toISOString(),
    });
  };

  const handleApprove = (pack: ExecutiveReviewPack) => {
    handleStatusChange(pack, "Approved", {
      approvedBy: "admin",
      approvedAt: new Date().toISOString(),
    });
  };

  const handlePublish = (pack: ExecutiveReviewPack) => {
    handleStatusChange(pack, "Published", {
      isPublished: true,
      publishedBy: "admin",
      publishedAt: new Date().toISOString(),
    });
  };

  const handleArchive = (pack: ExecutiveReviewPack) => {
    handleStatusChange(pack, "Archived");
  };

  const openDetailDialog = (pack: ExecutiveReviewPack) => {
    setDetailPack(pack);
    setDetailDialogOpen(true);
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

  const parseJsonField = (jsonStr: string): string[] => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) return parsed.map(String);
      return [];
    } catch {
      return [];
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 bg-muted animate-pulse rounded" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-0 border shadow-none">
              <CardContent className="p-4">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-3" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
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
          <Briefcase className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Executive Review Packs</h2>
          <Badge variant="outline" className="text-xs">
            {pagination.total} pack{pagination.total !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Pack
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-muted-foreground">Drafts</span>
            </div>
            <p className="text-2xl font-bold">{draftCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">In Review</span>
            </div>
            <p className="text-2xl font-bold">{inReviewCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Approved</span>
            </div>
            <p className="text-2xl font-bold">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Send className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Published</span>
            </div>
            <p className="text-2xl font-bold">{publishedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
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
              <SelectItem key={c} value={c}>{COUNTRY_FLAGS[c]} {c}</SelectItem>
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
            {PACK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={periodFilter}
          onValueChange={(v) => { setPeriodFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={audienceFilter}
          onValueChange={(v) => { setAudienceFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Audiences</SelectItem>
            {AUDIENCE_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pack Cards Grid */}
      {packs.length === 0 ? (
        <Card className="p-0 border shadow-none">
          <CardContent className="p-8 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No review packs found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a new executive review pack to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <Card key={pack.id} className="p-0 border shadow-none hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{pack.packName}</h3>
                  </div>
                  {pack.isPublished && (
                    <Badge className="text-[9px] h-4 px-1 bg-purple-100 text-purple-800 shrink-0">
                      Published
                    </Badge>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Badge
                    className={cn(
                      "text-[10px] h-4 px-1.5",
                      STATUS_COLORS[pack.status as PackStatus] || "bg-gray-100 text-gray-800"
                    )}
                  >
                    {pack.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                    {pack.period}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                    {COUNTRY_FLAGS[pack.country as Country]} {pack.country}
                  </Badge>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Audience: {pack.audience}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Generated: {formatDate(pack.generatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>Reviewed: {formatDate(pack.reviewedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Approved: {formatDate(pack.approvedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2"
                    onClick={() => openDetailDialog(pack)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  {pack.status === "Draft" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleGenerate(pack)}
                        disabled={processing}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleReview(pack)}
                        disabled={processing}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </>
                  )}
                  {pack.status === "InReview" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => handleApprove(pack)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                  )}
                  {pack.status === "Approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => handlePublish(pack)}
                      disabled={processing}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Publish
                    </Button>
                  )}
                  {pack.status !== "Archived" && pack.status !== "Published" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => handleArchive(pack)}
                      disabled={processing}
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      {/* Create Pack Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Review Pack</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Pack Name *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formPackName}
                onChange={(e) => setFormPackName(e.target.value)}
                placeholder="e.g., Q1 2025 Kenya Executive Review"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Period *</Label>
                <Select value={formPeriod} onValueChange={(v) => setFormPeriod(v ?? "Q1 2025")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Country *</Label>
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
              <Label className="text-xs">Audience</Label>
              <Select value={formAudience} onValueChange={(v) => setFormAudience(v ?? "Executive Team")}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Sections (JSON array or one per line)</Label>
              <Textarea
                className="text-sm mt-1 min-h-[80px] font-mono"
                value={formSections}
                onChange={(e) => setFormSections(e.target.value)}
                placeholder={'["Executive Summary", "KPI Dashboard", "Risk Assessment"]'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Pack"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailPack?.packName}</DialogTitle>
          </DialogHeader>
          {detailPack && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Status & metadata */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={cn(
                    "text-xs",
                    STATUS_COLORS[detailPack.status as PackStatus] || "bg-gray-100 text-gray-800"
                  )}
                >
                  {detailPack.status}
                </Badge>
                <Badge variant="outline" className="text-xs">{detailPack.period}</Badge>
                <Badge variant="outline" className="text-xs">
                  {COUNTRY_FLAGS[detailPack.country as Country]} {detailPack.country}
                </Badge>
                <Badge variant="outline" className="text-xs">{detailPack.audience}</Badge>
              </div>

              {/* Sections */}
              {(() => {
                const sections = parseJsonField(detailPack.sections);
                return sections.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sections</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {sections.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* KPI Summary */}
              {(() => {
                const kpis = parseJsonField(detailPack.kpiSummary);
                return kpis.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Globe className="h-4 w-4" /> KPI Summary
                    </h4>
                    <ul className="space-y-1">
                      {kpis.map((k, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {k}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* Highlights */}
              {(() => {
                const items = parseJsonField(detailPack.highlights);
                return items.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-green-500" /> Highlights
                    </h4>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* Risks */}
              {(() => {
                const items = parseJsonField(detailPack.risks);
                return items.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> Risks
                    </h4>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* Recommendations */}
              {(() => {
                const items = parseJsonField(detailPack.recommendations);
                return items.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-blue-500" /> Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* Action Items */}
              {(() => {
                const items = parseJsonField(detailPack.actionItems);
                return items.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <FileText className="h-4 w-4 text-purple-500" /> Action Items
                    </h4>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* Metadata */}
              <div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
                <p>Generated by: {detailPack.generatedBy ?? "\u2014"} on {formatDate(detailPack.generatedAt)}</p>
                <p>Reviewed by: {detailPack.reviewedBy ?? "\u2014"} on {formatDate(detailPack.reviewedAt)}</p>
                <p>Approved by: {detailPack.approvedBy ?? "\u2014"} on {formatDate(detailPack.approvedAt)}</p>
                <p>Published by: {detailPack.publishedBy ?? "\u2014"} on {formatDate(detailPack.publishedAt)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
