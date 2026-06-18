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
  ClipboardCheck,
  Plus,
  CheckCircle,
  XCircle,
  Archive,
  Clock,
  Database,
  AlertTriangle,
  Shield,
  Calendar,
  User,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type EvidenceType = "Document" | "Screenshot" | "Log" | "Metric" | "Report" | "Testimonial" | "Certification";
type EvidenceCategory = "Operational" | "Compliance" | "Performance" | "Training" | "Security" | "Financial";
type VerificationStatus = "Pending" | "Verified" | "Rejected";
type Country = "Kenya" | "Uganda" | "Tanzania" | "Ethiopia" | "Nigeria";

interface EvidenceItem {
  id: string;
  title: string;
  evidenceType: string;
  category: string;
  sourceSystem: string;
  collectedBy: string;
  collectedAt: string;
  verificationStatus: string;
  relatedKpi: string | null;
  expiryDate: string | null;
  description: string | null;
  fileUrl: string | null;
  country: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
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

const EVIDENCE_TYPES: EvidenceType[] = ["Document", "Screenshot", "Log", "Metric", "Report", "Testimonial", "Certification"];
const EVIDENCE_CATEGORIES: EvidenceCategory[] = ["Operational", "Compliance", "Performance", "Training", "Security", "Financial"];
const VERIFICATION_STATUSES: VerificationStatus[] = ["Pending", "Verified", "Rejected"];
const SOURCE_SYSTEMS = ["Aceli LAT", "Salesforce", "Manual Upload", "API Integration", "Third-Party Audit", "Internal Review"];

const TYPE_COLORS: Record<EvidenceType, string> = {
  Document: "bg-blue-100 text-blue-800",
  Screenshot: "bg-purple-100 text-purple-800",
  Log: "bg-gray-100 text-gray-800",
  Metric: "bg-green-100 text-green-800",
  Report: "bg-teal-100 text-teal-800",
  Testimonial: "bg-orange-100 text-orange-800",
  Certification: "bg-amber-100 text-amber-800",
};

const CATEGORY_COLORS: Record<EvidenceCategory, string> = {
  Operational: "bg-blue-100 text-blue-800",
  Compliance: "bg-red-100 text-red-800",
  Performance: "bg-green-100 text-green-800",
  Training: "bg-purple-100 text-purple-800",
  Security: "bg-amber-100 text-amber-800",
  Financial: "bg-teal-100 text-teal-800",
};

const VERIFICATION_COLORS: Record<VerificationStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Verified: "bg-green-100 text-green-800 border-green-300",
  Rejected: "bg-red-100 text-red-800 border-red-300",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EvidenceCapture() {
  // Data state
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formEvidenceType, setFormEvidenceType] = useState<string>("Document");
  const [formCategory, setFormCategory] = useState<string>("Operational");
  const [formSourceSystem, setFormSourceSystem] = useState<string>("Aceli LAT");
  const [formCollectedBy, setFormCollectedBy] = useState("");
  const [formRelatedKpi, setFormRelatedKpi] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCountry, setFormCountry] = useState<string>("Kenya");

  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectEvidenceId, setRejectEvidenceId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ─── Fetch evidence ────────────────────────────────────────────────────

  const fetchEvidence = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (evidenceTypeFilter !== "all") params.set("evidenceType", evidenceTypeFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (verificationStatusFilter !== "all") params.set("verificationStatus", verificationStatusFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);

    fetch(`/api/evidence?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setEvidence(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.pageSize, evidenceTypeFilter, categoryFilter, verificationStatusFilter, countryFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (evidenceTypeFilter !== "all") params.set("evidenceType", evidenceTypeFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (verificationStatusFilter !== "all") params.set("verificationStatus", verificationStatusFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);

    fetch(`/api/evidence?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setEvidence(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [pagination.page, pagination.pageSize, evidenceTypeFilter, categoryFilter, verificationStatusFilter, countryFilter]);

  // ─── Summary stats ─────────────────────────────────────────────────────

  const totalEvidence = pagination.total;
  const pendingCount = evidence.filter((e) => e.verificationStatus === "Pending").length;
  const verifiedCount = evidence.filter((e) => e.verificationStatus === "Verified").length;
  const rejectedCount = evidence.filter((e) => e.verificationStatus === "Rejected").length;

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formTitle || !formCollectedBy) return;
    setSubmitting(true);
    try {
      await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          evidenceType: formEvidenceType,
          category: formCategory,
          sourceSystem: formSourceSystem,
          collectedBy: formCollectedBy,
          collectedAt: new Date().toISOString(),
          verificationStatus: "Pending",
          relatedKpi: formRelatedKpi || undefined,
          expiryDate: formExpiryDate || undefined,
          description: formDescription || undefined,
          country: formCountry,
        }),
      });
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchEvidence();
    } catch (error) {
      console.error("Error creating evidence:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormTitle("");
    setFormEvidenceType("Document");
    setFormCategory("Operational");
    setFormSourceSystem("Aceli LAT");
    setFormCollectedBy("");
    setFormRelatedKpi("");
    setFormExpiryDate("");
    setFormDescription("");
    setFormCountry("Kenya");
  };

  const handleVerify = async (item: EvidenceItem) => {
    setProcessing(true);
    try {
      await fetch(`/api/evidence/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "Verified",
          verifiedBy: "admin",
          verifiedAt: new Date().toISOString(),
        }),
      });
      fetchEvidence();
    } catch (error) {
      console.error("Error verifying evidence:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectEvidenceId || !rejectionReason) return;
    setProcessing(true);
    try {
      await fetch(`/api/evidence/${rejectEvidenceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "Rejected",
          rejectionReason: rejectionReason,
          verifiedBy: "admin",
          verifiedAt: new Date().toISOString(),
        }),
      });
      setRejectDialogOpen(false);
      setRejectEvidenceId(null);
      setRejectionReason("");
      fetchEvidence();
    } catch (error) {
      console.error("Error rejecting evidence:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleArchive = async (item: EvidenceItem) => {
    setProcessing(true);
    try {
      await fetch(`/api/evidence/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "Archived",
        }),
      });
      fetchEvidence();
    } catch (error) {
      console.error("Error archiving evidence:", error);
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (item: EvidenceItem) => {
    setRejectEvidenceId(item.id);
    setRejectionReason("");
    setRejectDialogOpen(true);
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

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
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
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Evidence Capture</h2>
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
          Capture Evidence
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Evidence</span>
            </div>
            <p className="text-2xl font-bold">{totalEvidence}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Pending Review</span>
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Verified</span>
            </div>
            <p className="text-2xl font-bold">{verifiedCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Rejected</span>
            </div>
            <p className="text-2xl font-bold">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={evidenceTypeFilter}
          onValueChange={(v) => { setEvidenceTypeFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EVIDENCE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => { setCategoryFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EVIDENCE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={verificationStatusFilter}
          onValueChange={(v) => { setVerificationStatusFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {VERIFICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
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

      {/* Evidence Cards Grid */}
      {evidence.length === 0 ? (
        <Card className="p-0 border shadow-none">
          <CardContent className="p-8 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No evidence items found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Capture new evidence to start building your evidence base
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidence.map((item) => {
            const expired = isExpired(item.expiryDate);
            return (
              <Card key={item.id} className="p-0 border shadow-none hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <Badge
                      className={cn(
                        "text-[10px] h-4 px-1.5",
                        TYPE_COLORS[item.evidenceType as EvidenceType] || "bg-gray-100 text-gray-800"
                      )}
                    >
                      {item.evidenceType}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-[10px] h-4 px-1.5",
                        CATEGORY_COLORS[item.category as EvidenceCategory] || "bg-gray-100 text-gray-800"
                      )}
                    >
                      {item.category}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-[10px] h-4 px-1.5",
                        VERIFICATION_COLORS[item.verificationStatus as VerificationStatus] || "bg-gray-100 text-gray-800"
                      )}
                    >
                      {item.verificationStatus}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      <span>Source: {item.sourceSystem}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Collected by: {item.collectedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Collected: {formatDate(item.collectedAt)}</span>
                    </div>
                    {item.relatedKpi && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>Related KPI: {item.relatedKpi}</span>
                      </div>
                    )}
                    {item.expiryDate && (
                      <div className={cn(
                        "flex items-center gap-1",
                        expired && "text-red-600 font-medium"
                      )}>
                        <Calendar className="h-3 w-3" />
                        <span>
                          Expiry: {formatDate(item.expiryDate)}
                          {expired && " (Expired)"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{COUNTRY_FLAGS[item.country as Country]}</span>
                      <span>{item.country}</span>
                    </div>
                  </div>

                  {/* Expired warning */}
                  {expired && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 mb-3 bg-red-50 px-2 py-1 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      <span>This evidence has expired</span>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {item.verificationStatus === "Rejected" && item.rejectionReason && (
                    <div className="flex items-start gap-1.5 text-xs text-red-600 mb-3 bg-red-50 px-2 py-1 rounded">
                      <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>Reason: {item.rejectionReason}</span>
                    </div>
                  )}

                  {/* Verification info */}
                  {item.verifiedBy && (
                    <div className="text-[10px] text-muted-foreground mb-3">
                      Verified by: {item.verifiedBy} on {formatDate(item.verifiedAt)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.verificationStatus === "Pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={() => handleVerify(item)}
                          disabled={processing}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={() => openRejectDialog(item)}
                          disabled={processing}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {item.verificationStatus !== "Archived" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleArchive(item)}
                        disabled={processing}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

      {/* Capture Evidence Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Capture Evidence</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Q1 Training Completion Certificate"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Evidence Type</Label>
                <Select value={formEvidenceType} onValueChange={(v) => setFormEvidenceType(v ?? "Document")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "Operational")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Source System</Label>
                <Select value={formSourceSystem} onValueChange={(v) => setFormSourceSystem(v ?? "Aceli LAT")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_SYSTEMS.map((s) => (
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
              <Label className="text-xs">Collected By *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formCollectedBy}
                onChange={(e) => setFormCollectedBy(e.target.value)}
                placeholder="Name of the person who collected this evidence"
              />
            </div>
            <div>
              <Label className="text-xs">Related KPI</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formRelatedKpi}
                onChange={(e) => setFormRelatedKpi(e.target.value)}
                placeholder="KPI name this evidence supports"
              />
            </div>
            <div>
              <Label className="text-xs">Expiry Date</Label>
              <Input
                type="date"
                className="h-8 text-sm mt-1"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                className="text-sm mt-1 min-h-[60px]"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe this evidence..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Capturing..." : "Capture Evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Evidence Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Evidence</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              Please provide a reason for rejecting this evidence. The submitter will be notified.
            </div>
            <div>
              <Label className="text-xs">Rejection Reason *</Label>
              <Textarea
                className="text-sm mt-1 min-h-[80px]"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this evidence is being rejected..."
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
              onClick={handleReject}
              disabled={processing || !rejectionReason}
            >
              {processing ? "Rejecting..." : "Reject Evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
