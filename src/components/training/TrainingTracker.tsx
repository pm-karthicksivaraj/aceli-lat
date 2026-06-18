"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  GraduationCap,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TrainingRecord,
  TrainingModule,
  TrainingStatus,
  Country,
} from "@/lib/types";
import { COUNTRY_FLAGS, TRAINING_MODULE_LABELS } from "@/lib/types";

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];
const TRAINING_MODULES: TrainingModule[] = [
  "Onboarding",
  "CaptureReview",
  "OfflineSync",
  "Reporting",
  "AdminTools",
  "SalesforceIntegration",
];
const TRAINING_STATUS_COLORS: Record<TrainingStatus, string> = {
  NotStarted: "bg-gray-50 text-gray-700 border-gray-300",
  InProgress: "bg-blue-50 text-blue-700 border-blue-300",
  Completed: "bg-green-50 text-green-700 border-green-300",
  Failed: "bg-red-50 text-red-700 border-red-300",
  Waived: "bg-amber-50 text-amber-700 border-amber-300",
};

const TRAINING_STATUS_ICONS: Record<TrainingStatus, React.ElementType> = {
  NotStarted: Clock,
  InProgress: Clock,
  Completed: CheckCircle,
  Failed: XCircle,
  Waived: GraduationCap,
};

const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  NotStarted: "Not Started",
  InProgress: "In Progress",
  Completed: "Completed",
  Failed: "Failed",
  Waived: "Waived",
};

export function TrainingTracker() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add form state
  const [formUserId, setFormUserId] = useState("");
  const [formUserName, setFormUserName] = useState("");
  const [formCountry, setFormCountry] = useState<Country>("Kenya");
  const [formRole, setFormRole] = useState("");
  const [formModule, setFormModule] = useState<TrainingModule>("Onboarding");
  const [formTrainer, setFormTrainer] = useState("");

  const buildTrainingParams = useCallback(() => {
    const params = new URLSearchParams();
    if (countryFilter && countryFilter !== "all") params.set("country", countryFilter);
    if (moduleFilter && moduleFilter !== "all") params.set("module", moduleFilter);
    return params;
  }, [countryFilter, moduleFilter]);

  const fetchRecords = useCallback(() => {
    const params = buildTrainingParams();
    setLoading(true);
    fetch(`/api/training?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setRecords(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buildTrainingParams]);

  useEffect(() => {
    const controller = new AbortController();
    const params = buildTrainingParams();
    fetch(`/api/training?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setRecords(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [buildTrainingParams]);

  const handleAddRecord = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formUserId,
          userName: formUserName,
          country: formCountry,
          role: formRole,
          module: formModule,
          trainer: formTrainer,
          status: "NotStarted",
        }),
      });
      setAddDialogOpen(false);
      setFormUserId("");
      setFormUserName("");
      setFormRole("");
      setFormTrainer("");
      fetchRecords();
    } catch {
      // Error
    } finally {
      setSubmitting(false);
    }
  };

  // Summary counts
  const totalTrainees = records.length;
  const completed = records.filter((r) => r.status === "Completed").length;
  const inProgress = records.filter((r) => r.status === "InProgress").length;
  const notStarted = records.filter((r) => r.status === "NotStarted").length;

  // Module completion chart data
  const moduleChartData = TRAINING_MODULES.map((mod) => {
    const moduleRecords = records.filter((r) => r.module === mod);
    const completedCount = moduleRecords.filter((r) => r.status === "Completed").length;
    const totalCount = moduleRecords.length;
    return {
      module: mod,
      label: TRAINING_MODULE_LABELS[mod],
      completed: completedCount,
      total: totalCount,
      rate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    };
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-lg font-bold">{totalTrainees}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Total Trainees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <p className="text-lg font-bold text-green-600">{completed}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-lg font-bold text-blue-600">{inProgress}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-3.5 w-3.5 text-gray-400" />
              <p className="text-lg font-bold text-gray-600">{notStarted}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Not Started</p>
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
        <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v ?? "all")}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {TRAINING_MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {TRAINING_MODULE_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 text-xs ml-auto gap-1.5"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Training Record
        </Button>
      </div>

      {/* Module Completion Chart */}
      {!loading && records.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-3">Training Completion by Module</p>
            <div className="space-y-2">
              {moduleChartData.map((item) => (
                <div key={item.module} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-36 truncate shrink-0">
                    {item.label}
                  </span>
                  <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded transition-all",
                        item.rate >= 80 && "bg-green-500",
                        item.rate >= 40 && item.rate < 80 && "bg-amber-500",
                        item.rate < 40 && "bg-red-400"
                      )}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 w-16 text-right">
                    {item.completed}/{item.total}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Records Table */}
      <ScrollArea className="max-h-[calc(100vh-480px)]">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No training records found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add training records to track completion progress
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Country</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Module</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Score</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Trainer</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const statusColor = TRAINING_STATUS_COLORS[record.status as TrainingStatus] || TRAINING_STATUS_COLORS.NotStarted;
                    const StatusIcon = TRAINING_STATUS_ICONS[record.status as TrainingStatus] || Clock;
                    const statusLabel = TRAINING_STATUS_LABELS[record.status as TrainingStatus] || record.status;

                    return (
                      <tr key={record.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="p-2 font-medium">{record.userName}</td>
                        <td className="p-2">
                          <span className="flex items-center gap-1">
                            {COUNTRY_FLAGS[record.country as Country] || ""} {record.country}
                          </span>
                        </td>
                        <td className="p-2">{record.role}</td>
                        <td className="p-2">{TRAINING_MODULE_LABELS[record.module as TrainingModule] || record.module}</td>
                        <td className="p-2">
                          <Badge variant="outline" className={cn("text-[8px] h-4 px-1 border", statusColor)}>
                            <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                            {statusLabel}
                          </Badge>
                        </td>
                        <td className="p-2">{record.score !== null ? record.score : "—"}</td>
                        <td className="p-2">{record.trainer || "—"}</td>
                        <td className="p-2">{formatDate(record.completedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Add Training Record Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Training Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">User ID</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="User ID"
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">User Name</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Full name"
                  value={formUserName}
                  onChange={(e) => setFormUserName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs">Role</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. Field Officer"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Module</Label>
                <Select value={formModule} onValueChange={(v) => setFormModule(v as TrainingModule)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_MODULES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {TRAINING_MODULE_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Trainer</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Trainer name"
                  value={formTrainer}
                  onChange={(e) => setFormTrainer(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddRecord}
              disabled={submitting || !formUserId || !formUserName || !formRole}
            >
              {submitting ? "Adding..." : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
