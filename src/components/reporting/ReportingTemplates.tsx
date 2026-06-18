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
  FileText,
  Plus,
  CheckCircle,
  Clock,
  Users,
  Archive,
  Play,
  Sparkles,
  Hash,
  Calendar,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TemplateType = "Operational" | "Compliance" | "Executive" | "Analytical" | "Custom";
type TemplateStatus = "Draft" | "Active" | "Approved" | "Archived";

interface ReportingTemplate {
  id: string;
  templateName: string;
  templateType: string;
  description: string;
  audience: string;
  frequency: string;
  status: string;
  version: number;
  sections: string;
  lastGeneratedAt: string | null;
  generatedCount: number;
  country: string;
  createdBy: string;
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

const TEMPLATE_TYPES: TemplateType[] = ["Operational", "Compliance", "Executive", "Analytical", "Custom"];
const TEMPLATE_STATUSES: TemplateStatus[] = ["Draft", "Active", "Approved", "Archived"];
const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly", "Quarterly", "Annually", "OnDemand"];
const AUDIENCE_OPTIONS = ["Executive", "Management", "Operations", "Compliance", "All Staff", "External"];

const TYPE_COLORS: Record<TemplateType, string> = {
  Operational: "bg-blue-100 text-blue-800",
  Compliance: "bg-red-100 text-red-800",
  Executive: "bg-purple-100 text-purple-800",
  Analytical: "bg-green-100 text-green-800",
  Custom: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS: Record<TemplateStatus, string> = {
  Draft: "bg-gray-100 text-gray-800 border-gray-300",
  Active: "bg-green-100 text-green-800 border-green-300",
  Approved: "bg-blue-100 text-blue-800 border-blue-300",
  Archived: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportingTemplates() {
  // Data state
  const [templates, setTemplates] = useState<ReportingTemplate[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formTemplateName, setFormTemplateName] = useState("");
  const [formTemplateType, setFormTemplateType] = useState<string>("Operational");
  const [formDescription, setFormDescription] = useState("");
  const [formAudience, setFormAudience] = useState<string>("Management");
  const [formFrequency, setFormFrequency] = useState<string>("Monthly");
  const [formSections, setFormSections] = useState("");

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ─── Fetch templates ────────────────────────────────────────────────────

  const fetchTemplates = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (typeFilter !== "all") params.set("templateType", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (audienceFilter !== "all") params.set("audience", audienceFilter);

    fetch(`/api/reporting-templates?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setTemplates(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.pageSize, typeFilter, statusFilter, audienceFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (typeFilter !== "all") params.set("templateType", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (audienceFilter !== "all") params.set("audience", audienceFilter);

    fetch(`/api/reporting-templates?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setTemplates(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [pagination.page, pagination.pageSize, typeFilter, statusFilter, audienceFilter]);

  // ─── Summary stats ─────────────────────────────────────────────────────

  const activeCount = templates.filter((t) => t.status === "Active").length;
  const draftCount = templates.filter((t) => t.status === "Draft").length;
  const totalGenerated = templates.reduce((acc, t) => acc + (t.generatedCount || 0), 0);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formTemplateName || !formDescription || !formAudience) return;
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

      await fetch("/api/reporting-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: formTemplateName,
          templateType: formTemplateType,
          description: formDescription,
          audience: formAudience,
          frequency: formFrequency,
          sections: sectionsData,
          status: "Draft",
          version: 1,
          generatedCount: 0,
          country: "Kenya",
          createdBy: "admin",
        }),
      });
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormTemplateName("");
    setFormTemplateType("Operational");
    setFormDescription("");
    setFormAudience("Management");
    setFormFrequency("Monthly");
    setFormSections("");
  };

  const handleStatusChange = async (template: ReportingTemplate, newStatus: string) => {
    setProcessing(true);
    try {
      await fetch(`/api/reporting-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async (template: ReportingTemplate) => {
    setProcessing(true);
    try {
      await fetch(`/api/reporting-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastGeneratedAt: new Date().toISOString(),
          generatedCount: (template.generatedCount || 0) + 1,
        }),
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error generating report:", error);
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

  const parseSections = (sectionsJson: string): string[] => {
    try {
      const parsed = JSON.parse(sectionsJson);
      if (Array.isArray(parsed)) return parsed;
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
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Reporting Templates</h2>
          <Badge variant="outline" className="text-xs">
            {pagination.total} template{pagination.total !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Template
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Templates</span>
            </div>
            <p className="text-2xl font-bold">{pagination.total}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Drafts</span>
            </div>
            <p className="text-2xl font-bold">{draftCount}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Total Generated</span>
            </div>
            <p className="text-2xl font-bold">{totalGenerated}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={typeFilter}
          onValueChange={(v) => { setTypeFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TEMPLATE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
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
            {TEMPLATE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={audienceFilter}
          onValueChange={(v) => { setAudienceFilter(v ?? "all"); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
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

      {/* Template Cards Grid */}
      {templates.length === 0 ? (
        <Card className="p-0 border shadow-none">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No templates found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a new reporting template to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const sections = parseSections(template.sections);
            return (
              <Card key={template.id} className="p-0 border shadow-none hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{template.templateName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <Badge
                      className={cn(
                        "text-[10px] h-4 px-1.5",
                        TYPE_COLORS[template.templateType as TemplateType] || "bg-gray-100 text-gray-800"
                      )}
                    >
                      {template.templateType}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-[10px] h-4 px-1.5",
                        STATUS_COLORS[template.status as TemplateStatus] || "bg-gray-100 text-gray-800"
                      )}
                    >
                      {template.status}
                    </Badge>
                  </div>

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{template.audience}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{template.frequency}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      <span>v{template.version}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>{template.generatedCount} generated</span>
                    </div>
                  </div>

                  {/* Sections preview */}
                  {sections.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Sections:</p>
                      <div className="flex flex-wrap gap-1">
                        {sections.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] h-4 px-1">
                            {typeof s === "string" ? s : JSON.stringify(s)}
                          </Badge>
                        ))}
                        {sections.length > 3 && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            +{sections.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Last generated */}
                  <div className="text-[10px] text-muted-foreground mb-3">
                    Last generated: {formatDate(template.lastGeneratedAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {template.status === "Draft" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={() => handleStatusChange(template, "Approved")}
                          disabled={processing}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={() => handleStatusChange(template, "Active")}
                          disabled={processing}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Activate
                        </Button>
                      </>
                    )}
                    {(template.status === "Active" || template.status === "Approved") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleGenerate(template)}
                        disabled={processing}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                    )}
                    {template.status === "Approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleStatusChange(template, "Active")}
                        disabled={processing}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Activate
                      </Button>
                    )}
                    {template.status !== "Archived" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleStatusChange(template, "Archived")}
                        disabled={processing}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                    )}
                    {template.status === "Archived" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleStatusChange(template, "Draft")}
                        disabled={processing}
                      >
                        Restore
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

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Reporting Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Template Name *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formTemplateName}
                onChange={(e) => setFormTemplateName(e.target.value)}
                placeholder="e.g., Monthly Lender Performance Report"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type *</Label>
                <Select value={formTemplateType} onValueChange={(v) => setFormTemplateType(v ?? "Operational")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Audience *</Label>
                <Select value={formAudience} onValueChange={(v) => setFormAudience(v ?? "Management")}>
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
            </div>
            <div>
              <Label className="text-xs">Description *</Label>
              <Textarea
                className="text-sm mt-1 min-h-[60px]"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What this report template covers..."
              />
            </div>
            <div>
              <Label className="text-xs">Frequency</Label>
              <Select value={formFrequency} onValueChange={(v) => setFormFrequency(v ?? "Monthly")}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
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
                placeholder={'["Executive Summary", "KPI Overview", "Recommendations"]'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
