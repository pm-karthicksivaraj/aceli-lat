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
  Target,
  CheckCircle,
  AlertTriangle,
  Plus,
  BarChart3,
  Clock,
  Activity,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type KPIStatus = "Active" | "Paused" | "Achieved" | "Discontinued";
type KPICategory = "Adoption" | "Efficiency" | "Quality" | "Satisfaction" | "Impact" | "Compliance";
type Country = "Kenya" | "Uganda" | "Tanzania" | "Ethiopia" | "Nigeria";

interface OutcomeKPI {
  id: string;
  kpiName: string;
  category: string;
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  measurementUnit: string;
  collectionFrequency: string;
  status: string;
  isPrimary: boolean;
  country: string;
  lastMeasuredAt: string | null;
  methodology: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OutcomeMeasurement {
  id: string;
  kpiId: string;
  measuredValue: number;
  period: string;
  measuredBy: string;
  methodology: string | null;
  notes: string | null;
  measuredAt: string;
  createdAt: string;
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

const STATUS_OPTIONS: KPIStatus[] = ["Active", "Paused", "Achieved", "Discontinued"];
const CATEGORY_OPTIONS: KPICategory[] = ["Adoption", "Efficiency", "Quality", "Satisfaction", "Impact", "Compliance"];
const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly", "Quarterly", "Annually"];

const STATUS_BADGE_COLORS: Record<KPIStatus, string> = {
  Active: "bg-green-100 text-green-800 border-green-300",
  Paused: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Achieved: "bg-blue-100 text-blue-800 border-blue-300",
  Discontinued: "bg-gray-100 text-gray-800 border-gray-300",
};

const CATEGORY_COLORS: Record<KPICategory, string> = {
  Adoption: "bg-blue-100 text-blue-800",
  Efficiency: "bg-green-100 text-green-800",
  Quality: "bg-purple-100 text-purple-800",
  Satisfaction: "bg-orange-100 text-orange-800",
  Impact: "bg-red-100 text-red-800",
  Compliance: "bg-teal-100 text-teal-800",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function OutcomeDashboard() {
  // Data state
  const [kpis, setKpis] = useState<OutcomeKPI[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formKpiName, setFormKpiName] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Adoption");
  const [formTargetValue, setFormTargetValue] = useState("");
  const [formBaselineValue, setFormBaselineValue] = useState("");
  const [formMeasurementUnit, setFormMeasurementUnit] = useState("");
  const [formCollectionFrequency, setFormCollectionFrequency] = useState<string>("Monthly");
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formCountry, setFormCountry] = useState<string>("Kenya");
  const [formMethodology, setFormMethodology] = useState("");
  const [formOwner, setFormOwner] = useState("");

  // Measurement dialog
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [measurementKpiId, setMeasurementKpiId] = useState<string | null>(null);
  const [measurementValue, setMeasurementValue] = useState("");
  const [measurementPeriod, setMeasurementPeriod] = useState("");
  const [measurementBy, setMeasurementBy] = useState("");
  const [measurementMethodology, setMeasurementMethodology] = useState("");
  const [measurementNotes, setMeasurementNotes] = useState("");

  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyKpi, setHistoryKpi] = useState<OutcomeKPI | null>(null);
  const [measurements, setMeasurements] = useState<OutcomeMeasurement[]>([]);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ─── Fetch KPIs ─────────────────────────────────────────────────────────

  const fetchKpis = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);

    fetch(`/api/outcome-kpis?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setKpis(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.pageSize, statusFilter, categoryFilter, countryFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (countryFilter !== "all") params.set("country", countryFilter);

    fetch(`/api/outcome-kpis?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setKpis(json.data || []);
          if (json.pagination) setPagination(json.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [pagination.page, pagination.pageSize, statusFilter, categoryFilter, countryFilter]);

  // ─── Summary stats ─────────────────────────────────────────────────────

  const totalKpis = pagination.total;
  const primaryKpis = kpis.filter((k) => k.isPrimary).length;
  const onTarget = kpis.filter((k) => k.targetValue > 0 && k.currentValue >= k.targetValue).length;
  const belowTarget = kpis.filter((k) => k.targetValue > 0 && k.currentValue < k.targetValue && k.status === "Active").length;

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formKpiName || !formTargetValue || !formBaselineValue || !formMeasurementUnit) return;
    setSubmitting(true);
    try {
      await fetch("/api/outcome-kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpiName: formKpiName,
          category: formCategory,
          targetValue: Number(formTargetValue),
          baselineValue: Number(formBaselineValue),
          currentValue: Number(formBaselineValue),
          measurementUnit: formMeasurementUnit,
          collectionFrequency: formCollectionFrequency,
          isPrimary: formIsPrimary,
          country: formCountry,
          status: "Active",
          methodology: formMethodology || undefined,
          owner: formOwner || undefined,
        }),
      });
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchKpis();
    } catch (error) {
      console.error("Error creating KPI:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormKpiName("");
    setFormCategory("Adoption");
    setFormTargetValue("");
    setFormBaselineValue("");
    setFormMeasurementUnit("");
    setFormCollectionFrequency("Monthly");
    setFormIsPrimary(false);
    setFormCountry("Kenya");
    setFormMethodology("");
    setFormOwner("");
  };

  const handleRecordMeasurement = async () => {
    if (!measurementKpiId || !measurementValue || !measurementPeriod || !measurementBy) return;
    setProcessing(true);
    try {
      await fetch("/api/outcome-measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpiId: measurementKpiId,
          measuredValue: Number(measurementValue),
          period: measurementPeriod,
          measuredBy: measurementBy,
          methodology: measurementMethodology || undefined,
          notes: measurementNotes || undefined,
        }),
      });

      // Also update the KPI's current value
      await fetch(`/api/outcome-kpis/${measurementKpiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentValue: Number(measurementValue),
          lastMeasuredAt: new Date().toISOString(),
        }),
      });

      setMeasurementDialogOpen(false);
      setMeasurementKpiId(null);
      setMeasurementValue("");
      setMeasurementPeriod("");
      setMeasurementBy("");
      setMeasurementMethodology("");
      setMeasurementNotes("");
      fetchKpis();
    } catch (error) {
      console.error("Error recording measurement:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (kpi: OutcomeKPI, newStatus: string) => {
    setProcessing(true);
    try {
      await fetch(`/api/outcome-kpis/${kpi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchKpis();
    } catch (error) {
      console.error("Error updating KPI status:", error);
    } finally {
      setProcessing(false);
    }
  };

  const openMeasurementDialog = (kpi: OutcomeKPI) => {
    setMeasurementKpiId(kpi.id);
    setMeasurementValue("");
    setMeasurementPeriod("");
    setMeasurementBy("");
    setMeasurementMethodology(kpi.methodology ?? "");
    setMeasurementNotes("");
    setMeasurementDialogOpen(true);
  };

  const openHistoryDialog = async (kpi: OutcomeKPI) => {
    setHistoryKpi(kpi);
    setHistoryDialogOpen(true);
    setMeasurementsLoading(true);
    try {
      const res = await fetch(`/api/outcome-measurements?kpiId=${kpi.id}`);
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data.data || data || []);
      }
    } catch {
      // Error
    } finally {
      setMeasurementsLoading(false);
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

  const getProgressPercent = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-green-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-red-500";
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
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Outcome KPIs</h2>
          <Badge variant="outline" className="text-xs">
            {pagination.total} KPI{pagination.total !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New KPI
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total KPIs</span>
            </div>
            <p className="text-2xl font-bold">{totalKpis}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Primary KPIs</span>
            </div>
            <p className="text-2xl font-bold">{primaryKpis}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">On Target</span>
            </div>
            <p className="text-2xl font-bold">{onTarget}</p>
          </CardContent>
        </Card>
        <Card className="p-0 border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Below Target</span>
            </div>
            <p className="text-2xl font-bold">{belowTarget}</p>
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
              <SelectItem key={c} value={c}>
                {COUNTRY_FLAGS[c]} {c}
              </SelectItem>
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
            {CATEGORY_OPTIONS.map((c) => (
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
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards Grid */}
      {kpis.length === 0 ? (
        <Card className="p-0 border shadow-none">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No KPIs found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a new KPI to start tracking outcomes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => {
            const progress = getProgressPercent(kpi.currentValue, kpi.targetValue);
            const progressColor = getProgressColor(progress);
            return (
              <Card key={kpi.id} className="p-0 border shadow-none hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{kpi.kpiName}</h3>
                        {kpi.isPrimary && (
                          <Badge className="text-[9px] h-4 px-1 bg-purple-100 text-purple-800 shrink-0">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={cn(
                            "text-[10px] h-4 px-1.5",
                            CATEGORY_COLORS[kpi.category as KPICategory] || "bg-gray-100 text-gray-800"
                          )}
                        >
                          {kpi.category}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-[10px] h-4 px-1.5",
                            STATUS_BADGE_COLORS[kpi.status as KPIStatus] || "bg-gray-100 text-gray-800"
                          )}
                        >
                          {kpi.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Values */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Baseline</p>
                      <p className="text-sm font-semibold">
                        {kpi.baselineValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Current</p>
                      <p className="text-sm font-semibold text-primary">
                        {kpi.currentValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Target</p>
                      <p className="text-sm font-semibold">
                        {kpi.targetValue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", progressColor)}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
                    <span>{kpi.measurementUnit}</span>
                    <span>{kpi.collectionFrequency}</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last: {formatDate(kpi.lastMeasuredAt)}
                    </span>
                    <span>{COUNTRY_FLAGS[kpi.country as Country]} {kpi.country}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {kpi.status === "Active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => openMeasurementDialog(kpi)}
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        Record
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => openHistoryDialog(kpi)}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      History
                    </Button>
                    {kpi.status === "Active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleUpdateStatus(kpi, "Paused")}
                        disabled={processing}
                      >
                        Pause
                      </Button>
                    )}
                    {kpi.status === "Paused" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleUpdateStatus(kpi, "Active")}
                        disabled={processing}
                      >
                        Resume
                      </Button>
                    )}
                    {kpi.currentValue >= kpi.targetValue && kpi.status === "Active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleUpdateStatus(kpi, "Achieved")}
                        disabled={processing}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Achieved
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

      {/* Create KPI Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New KPI</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">KPI Name *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formKpiName}
                onChange={(e) => setFormKpiName(e.target.value)}
                placeholder="e.g., Lender Activation Rate"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category *</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "Adoption")}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Target Value *</Label>
                <Input
                  type="number"
                  className="h-8 text-sm mt-1"
                  value={formTargetValue}
                  onChange={(e) => setFormTargetValue(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <Label className="text-xs">Baseline Value *</Label>
                <Input
                  type="number"
                  className="h-8 text-sm mt-1"
                  value={formBaselineValue}
                  onChange={(e) => setFormBaselineValue(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Measurement Unit *</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  value={formMeasurementUnit}
                  onChange={(e) => setFormMeasurementUnit(e.target.value)}
                  placeholder="e.g., %, count, days"
                />
              </div>
              <div>
                <Label className="text-xs">Collection Frequency</Label>
                <Select value={formCollectionFrequency} onValueChange={(v) => setFormCollectionFrequency(v ?? "Monthly")}>
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
            </div>
            <div>
              <Label className="text-xs">Methodology</Label>
              <Textarea
                className="text-sm mt-1 min-h-[60px]"
                value={formMethodology}
                onChange={(e) => setFormMethodology(e.target.value)}
                placeholder="How this KPI is measured..."
              />
            </div>
            <div>
              <Label className="text-xs">Owner</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={formOwner}
                onChange={(e) => setFormOwner(e.target.value)}
                placeholder="Person responsible"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formIsPrimary}
                onChange={(e) => setFormIsPrimary(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPrimary" className="text-xs">
                Mark as Primary KPI
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create KPI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Measurement Dialog */}
      <Dialog open={measurementDialogOpen} onOpenChange={setMeasurementDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Measurement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Measured Value *</Label>
              <Input
                type="number"
                className="h-8 text-sm mt-1"
                value={measurementValue}
                onChange={(e) => setMeasurementValue(e.target.value)}
                placeholder="Enter the measured value"
              />
            </div>
            <div>
              <Label className="text-xs">Period *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={measurementPeriod}
                onChange={(e) => setMeasurementPeriod(e.target.value)}
                placeholder="e.g., Q1 2025, Jan 2025"
              />
            </div>
            <div>
              <Label className="text-xs">Measured By *</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={measurementBy}
                onChange={(e) => setMeasurementBy(e.target.value)}
                placeholder="Name of person measuring"
              />
            </div>
            <div>
              <Label className="text-xs">Methodology</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={measurementMethodology}
                onChange={(e) => setMeasurementMethodology(e.target.value)}
                placeholder="Method used for measurement"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                className="text-sm mt-1 min-h-[60px]"
                value={measurementNotes}
                onChange={(e) => setMeasurementNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMeasurementDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRecordMeasurement} disabled={processing}>
              {processing ? "Saving..." : "Record Measurement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Measurement History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Measurement History: {historyKpi?.kpiName}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {measurementsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : measurements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No measurements recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {measurements.map((m) => (
                  <Card key={m.id} className="p-0 border shadow-none">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-4">
                            {m.period}
                          </Badge>
                          <span className="text-sm font-semibold">
                            {m.measuredValue.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(m.measuredAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>By: {m.measuredBy}</span>
                        {m.methodology && <span>Method: {m.methodology}</span>}
                      </div>
                      {m.notes && (
                        <p className="text-[10px] text-muted-foreground mt-1">{m.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
