"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Country } from "@/lib/types";
import { COUNTRY_FLAGS } from "@/lib/types";
import { Users, Activity, Clock, BarChart3, ArrowUp, ArrowDown, Plus } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WeeklyUsageRecord {
  id: string;
  country: string;
  weekStartDate: string;
  weekEndDate: string;
  totalUsers: number;
  activeUsers: number;
  captureActions: number;
  reviewActions: number;
  syncActions: number;
  writebackActions: number;
  averageSessionMinutes: number;
  peakConcurrentUsers: number;
  recordedBy: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WeeklyUsageStats {
  totalUsers: number;
  activeUsers: number;
  captureActions: number;
  reviewActions: number;
  syncActions: number;
  writebackActions: number;
  averageSessionMinutes: number;
  peakConcurrentUsers: number;
}

interface WeeklyUsageResponse {
  data: WeeklyUsageRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: WeeklyUsageStats;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];
const PAGE_SIZE = 10;

const COUNTRY_BAR_COLORS: Record<string, string> = {
  Kenya: "bg-green-500/80",
  Uganda: "bg-red-400/80",
  Tanzania: "bg-blue-500/80",
  Ethiopia: "bg-amber-500/80",
  Nigeria: "bg-emerald-400/80",
};

// ─── Helper ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ─── Adoption Rate Bar Component ────────────────────────────────────────────

function AdoptionRateBar({ rate, country }: { rate: number; country: string }) {
  const barColor = COUNTRY_BAR_COLORS[country] || "bg-primary/60";
  const clampedRate = Math.min(100, Math.max(0, rate));

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${clampedRate}%` }}
        />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground w-10 text-right">
        {rate.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Stat Card Component ────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  color = "text-blue-600",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  trend?: "up" | "down" | null;
  color?: string;
}) {
  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-bold">{value}</p>
              {trend === "up" && (
                <ArrowUp className="h-3.5 w-3.5 text-green-500" />
              )}
              {trend === "down" && (
                <ArrowDown className="h-3.5 w-3.5 text-red-500" />
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-2 rounded-lg bg-muted/50", color)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function WeeklyActiveUseDashboard() {
  // Data state
  const [records, setRecords] = useState<WeeklyUsageRecord[]>([]);
  const [stats, setStats] = useState<WeeklyUsageStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [country, setCountry] = useState<string>("all");

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for adding a record
  const [formCountry, setFormCountry] = useState<Country>("Kenya");
  const [formWeekStartDate, setFormWeekStartDate] = useState("");
  const [formWeekEndDate, setFormWeekEndDate] = useState("");
  const [formTotalUsers, setFormTotalUsers] = useState("");
  const [formActiveUsers, setFormActiveUsers] = useState("");
  const [formCaptureActions, setFormCaptureActions] = useState("");
  const [formReviewActions, setFormReviewActions] = useState("");
  const [formSyncActions, setFormSyncActions] = useState("");
  const [formWritebackActions, setFormWritebackActions] = useState("");
  const [formAvgSession, setFormAvgSession] = useState("");
  const [formPeakUsers, setFormPeakUsers] = useState("");
  const [formRecordedBy, setFormRecordedBy] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // ─── Data Fetching ────────────────────────────────────────────────────

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(PAGE_SIZE));
        if (country && country !== "all") params.set("country", country);

        const res = await fetch(`/api/rollout/weekly-usage?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch data");

        const json: WeeklyUsageResponse = await res.json();
        setRecords(json.data || []);
        setPagination(json.pagination);
        setStats(json.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setRecords([]);
      } finally {
        setLoading(false);
      }
    },
    [country]
  );

  // Initial fetch and refetch when country changes
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", String(PAGE_SIZE));
    if (country && country !== "all") params.set("country", country);

    fetch(`/api/rollout/weekly-usage?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: WeeklyUsageResponse | null) => {
        if (json) {
          setRecords(json.data || []);
          setPagination(json.pagination);
          setStats(json.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [country]);

  // ─── Add Record Handler ──────────────────────────────────────────────

  const resetForm = () => {
    setFormCountry("Kenya");
    setFormWeekStartDate("");
    setFormWeekEndDate("");
    setFormTotalUsers("");
    setFormActiveUsers("");
    setFormCaptureActions("");
    setFormReviewActions("");
    setFormSyncActions("");
    setFormWritebackActions("");
    setFormAvgSession("");
    setFormPeakUsers("");
    setFormRecordedBy("");
    setFormNotes("");
  };

  const handleAddRecord = async () => {
    if (!formCountry || !formWeekStartDate || !formWeekEndDate || !formRecordedBy) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rollout/weekly-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: formCountry,
          weekStartDate: formWeekStartDate,
          weekEndDate: formWeekEndDate,
          totalUsers: parseInt(formTotalUsers) || 0,
          activeUsers: parseInt(formActiveUsers) || 0,
          captureActions: parseInt(formCaptureActions) || 0,
          reviewActions: parseInt(formReviewActions) || 0,
          syncActions: parseInt(formSyncActions) || 0,
          writebackActions: parseInt(formWritebackActions) || 0,
          averageSessionMinutes: parseFloat(formAvgSession) || 0,
          peakConcurrentUsers: parseInt(formPeakUsers) || 0,
          recordedBy: formRecordedBy,
          notes: formNotes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create record");

      setAddDialogOpen(false);
      resetForm();
      fetchData(1);
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Pagination Controls ─────────────────────────────────────────────

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchData(page);
  };

  // ─── Adoption Rate by Country (latest record per country) ────────────

  const adoptionByCountry = COUNTRIES.map((c) => {
    const countryRecords = records
      .filter((r) => r.country === c)
      .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());

    if (countryRecords.length === 0) {
      return { country: c, rate: 0, activeUsers: 0, totalUsers: 0, hasData: false };
    }

    const latest = countryRecords[0];
    const rate = latest.totalUsers > 0 ? (latest.activeUsers / latest.totalUsers) * 100 : 0;

    return {
      country: c,
      rate,
      activeUsers: latest.activeUsers,
      totalUsers: latest.totalUsers,
      hasData: true,
    };
  });

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Weekly Active Use</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track adoption and engagement across all rollout countries
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={country} onValueChange={(v) => setCountry(v ?? "all")}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="All Countries" />
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
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              resetForm();
              setAddDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Record
          </Button>
        </div>
      </div>

      {/* ── Summary Stat Cards ── */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            title="Active Users"
            value={formatNumber(stats.activeUsers)}
            icon={Users}
            subtitle={`${formatNumber(stats.totalUsers)} total registered`}
            color="text-blue-600"
          />
          <StatCard
            title="Capture Actions"
            value={formatNumber(stats.captureActions)}
            icon={Activity}
            color="text-emerald-600"
          />
          <StatCard
            title="Review Actions"
            value={formatNumber(stats.reviewActions)}
            icon={BarChart3}
            color="text-violet-600"
          />
          <StatCard
            title="Avg Session"
            value={`${stats.averageSessionMinutes.toFixed(1)} min`}
            icon={Clock}
            color="text-amber-600"
          />
          <StatCard
            title="Peak Users"
            value={formatNumber(stats.peakConcurrentUsers)}
            icon={Users}
            subtitle="Concurrent"
            color="text-rose-600"
          />
        </div>
      ) : null}

      {/* ── Adoption Rate Trend by Country ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Adoption Rate by Country</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {adoptionByCountry.map((item) => (
            <div key={item.country} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-28 shrink-0">
                <span className="text-sm">{COUNTRY_FLAGS[item.country as Country]}</span>
                <span className="text-xs font-medium">{item.country}</span>
              </div>
              <div className="flex-1">
                <AdoptionRateBar rate={item.rate} country={item.country} />
              </div>
              <div className="text-[10px] text-muted-foreground w-24 text-right shrink-0">
                {item.hasData ? (
                  <>
                    {item.activeUsers}/{item.totalUsers} users
                  </>
                ) : (
                  <span className="italic">No data</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Comparison Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Country-by-Country Comparison
            </CardTitle>
            {pagination.total > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {pagination.total} records
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs"
                onClick={() => fetchData(1)}
              >
                Retry
              </Button>
            </div>
          ) : loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No weekly usage data available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add records to start tracking adoption across countries
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                        Country
                      </th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                        Week
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Total Users
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Active Users
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Adoption %
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Capture
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Review
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Sync
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Writeback
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Avg Session
                      </th>
                      <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                        Peak
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const adoptionRate =
                        record.totalUsers > 0
                          ? (record.activeUsers / record.totalUsers) * 100
                          : 0;

                      return (
                        <tr
                          key={record.id}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">
                                {COUNTRY_FLAGS[record.country as Country] || ""}
                              </span>
                              <span className="font-medium">{record.country}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {formatDate(record.weekStartDate)} –{" "}
                            {formatDate(record.weekEndDate)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {record.totalUsers.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {record.activeUsers.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] h-5 px-1.5 font-medium",
                                adoptionRate >= 70
                                  ? "bg-green-50 text-green-700 border-green-300"
                                  : adoptionRate >= 40
                                    ? "bg-amber-50 text-amber-700 border-amber-300"
                                    : "bg-red-50 text-red-700 border-red-300"
                              )}
                            >
                              {adoptionRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {record.captureActions.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {record.reviewActions.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            {record.syncActions.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            {record.writebackActions.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {record.averageSessionMinutes.toFixed(1)}
                            <span className="text-muted-foreground ml-0.5">min</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {record.peakConcurrentUsers}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-2 p-3 max-h-96 overflow-y-auto">
                {records.map((record) => {
                  const adoptionRate =
                    record.totalUsers > 0
                      ? (record.activeUsers / record.totalUsers) * 100
                      : 0;

                  return (
                    <Card key={record.id} className="shadow-none border">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">
                              {COUNTRY_FLAGS[record.country as Country] || ""}
                            </span>
                            <span className="text-xs font-semibold">{record.country}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] h-5 px-1.5 font-medium",
                              adoptionRate >= 70
                                ? "bg-green-50 text-green-700 border-green-300"
                                : adoptionRate >= 40
                                  ? "bg-amber-50 text-amber-700 border-amber-300"
                                  : "bg-red-50 text-red-700 border-red-300"
                            )}
                          >
                            {adoptionRate.toFixed(1)}% adoption
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(record.weekStartDate)} –{" "}
                          {formatDate(record.weekEndDate)}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-1.5 bg-muted/50 rounded">
                            <p className="text-[9px] text-muted-foreground">Active</p>
                            <p className="text-xs font-bold">
                              {record.activeUsers}/{record.totalUsers}
                            </p>
                          </div>
                          <div className="text-center p-1.5 bg-muted/50 rounded">
                            <p className="text-[9px] text-muted-foreground">Capture</p>
                            <p className="text-xs font-bold">{record.captureActions}</p>
                          </div>
                          <div className="text-center p-1.5 bg-muted/50 rounded">
                            <p className="text-[9px] text-muted-foreground">Review</p>
                            <p className="text-xs font-bold">{record.reviewActions}</p>
                          </div>
                          <div className="text-center p-1.5 bg-muted/50 rounded">
                            <p className="text-[9px] text-muted-foreground">Sync</p>
                            <p className="text-xs font-bold">{record.syncActions}</p>
                          </div>
                          <div className="text-center p-1.5 bg-muted/50 rounded">
                            <p className="text-[9px] text-muted-foreground">Writeback</p>
                            <p className="text-xs font-bold">{record.writebackActions}</p>
                          </div>
                          <div className="text-center p-1.5 bg-muted/50 rounded">
                            <p className="text-[9px] text-muted-foreground">Avg Session</p>
                            <p className="text-xs font-bold">
                              {record.averageSessionMinutes.toFixed(1)}m
                            </p>
                          </div>
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

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} &middot;{" "}
            {pagination.total} total records
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-2"
              disabled={pagination.page <= 1}
              onClick={() => goToPage(1)}
            >
              First
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-2"
              disabled={pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
            >
              Prev
            </Button>
            {/* Page number buttons */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, and nearby pages
                return (
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - pagination.page) <= 1
                );
              })
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="text-[10px] text-muted-foreground px-1"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    size="sm"
                    variant={pagination.page === item ? "default" : "outline"}
                    className={cn(
                      "h-7 text-[10px] px-2.5 min-w-[28px]",
                      pagination.page === item && "pointer-events-none"
                    )}
                    onClick={() => goToPage(item)}
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-2"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => goToPage(pagination.page + 1)}
            >
              Next
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-2"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => goToPage(pagination.totalPages)}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* ── Add Record Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Weekly Usage Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Country & Recorded By */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Country *</Label>
                <Select
                  value={formCountry}
                  onValueChange={(v) => setFormCountry((v ?? "Kenya") as Country)}
                >
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
                <Label className="text-xs">Recorded By *</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Your name"
                  value={formRecordedBy}
                  onChange={(e) => setFormRecordedBy(e.target.value)}
                />
              </div>
            </div>

            {/* Week Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Week Start Date *</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={formWeekStartDate}
                  onChange={(e) => setFormWeekStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Week End Date *</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={formWeekEndDate}
                  onChange={(e) => setFormWeekEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Users */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Total Users</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  min="0"
                  value={formTotalUsers}
                  onChange={(e) => setFormTotalUsers(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Active Users</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  min="0"
                  value={formActiveUsers}
                  onChange={(e) => setFormActiveUsers(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Capture Actions</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  min="0"
                  value={formCaptureActions}
                  onChange={(e) => setFormCaptureActions(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Review Actions</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  min="0"
                  value={formReviewActions}
                  onChange={(e) => setFormReviewActions(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sync Actions</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  min="0"
                  value={formSyncActions}
                  onChange={(e) => setFormSyncActions(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Writeback Actions</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  min="0"
                  value={formWritebackActions}
                  onChange={(e) => setFormWritebackActions(e.target.value)}
                />
              </div>
            </div>

            {/* Session & Peak */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Avg Session (min)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                  value={formAvgSession}
                  onChange={(e) => setFormAvgSession(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Peak Concurrent Users</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  min="0"
                  value={formPeakUsers}
                  onChange={(e) => setFormPeakUsers(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Additional notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddRecord}
              disabled={
                submitting ||
                !formCountry ||
                !formWeekStartDate ||
                !formWeekEndDate ||
                !formRecordedBy
              }
            >
              {submitting ? "Saving..." : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
