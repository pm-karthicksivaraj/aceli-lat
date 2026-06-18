"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  Globe,
  Settings,
  CheckCircle,
  XCircle,
  Plus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CountryRolloutSummary,
  RolloutStatus,
  Country,
} from "@/lib/types";
import { COUNTRY_FLAGS, ROLLOUT_STATUS_COLORS } from "@/lib/types";

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];
const ROLLOUT_STATUSES: RolloutStatus[] = ["Pending", "InProgress", "Active", "Suspended"];

const MIGRATION_STATUS_COLORS: Record<string, string> = {
  NotStarted: "bg-gray-50 text-gray-700 border-gray-300",
  InProgress: "bg-blue-50 text-blue-700 border-blue-300",
  Completed: "bg-green-50 text-green-700 border-green-300",
  Failed: "bg-red-50 text-red-700 border-red-300",
};

const TRAINING_STATUS_COLORS: Record<string, string> = {
  NotStarted: "bg-gray-50 text-gray-700 border-gray-300",
  InProgress: "bg-amber-50 text-amber-700 border-amber-300",
  Completed: "bg-green-50 text-green-700 border-green-300",
};

export function CountryRolloutPanel() {
  const [summaries, setSummaries] = useState<CountryRolloutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [configureDialogCountry, setConfigureDialogCountry] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Configure form state
  const [formRolloutStatus, setFormRolloutStatus] = useState<RolloutStatus>("Pending");
  const [formFieldOfficerCount, setFormFieldOfficerCount] = useState("");
  const [formDataMigrationStatus, setFormDataMigrationStatus] = useState("NotStarted");
  const [formTrainingStatus, setFormTrainingStatus] = useState("NotStarted");
  const [formRoleSetupComplete, setFormRoleSetupComplete] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/country-config")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setSummaries(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/country-config", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setSummaries(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const openConfigureDialog = (summary: CountryRolloutSummary) => {
    setConfigureDialogCountry(summary.country);
    setFormRolloutStatus(summary.rolloutStatus);
    setFormFieldOfficerCount(String(summary.fieldOfficerCount));
    setFormDataMigrationStatus(summary.dataMigrationStatus);
    setFormTrainingStatus(summary.trainingStatus);
    setFormRoleSetupComplete(summary.roleSetupComplete);
  };

  const handleConfigure = async () => {
    if (!configureDialogCountry) return;
    setProcessing(true);
    try {
      await fetch("/api/country-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: configureDialogCountry,
          rolloutStatus: formRolloutStatus,
          fieldOfficerCount: parseInt(formFieldOfficerCount) || 0,
          dataMigrationStatus: formDataMigrationStatus,
          trainingStatus: formTrainingStatus,
          roleSetupComplete: formRoleSetupComplete,
        }),
      });
      setConfigureDialogCountry(null);
      fetchData();
    } catch {
      // Error
    } finally {
      setProcessing(false);
    }
  };

  const handleInitialize = async (country: string) => {
    setProcessing(true);
    try {
      await fetch("/api/country-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      fetchData();
    } catch {
      // Error
    } finally {
      setProcessing(false);
    }
  };

  // Build a map of countries with config
  const configuredCountries = new Map(summaries.map((s) => [s.country, s]));

  return (
    <div className="space-y-4">
      {/* Country Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COUNTRIES.map((country) => {
            const summary = configuredCountries.get(country);

            if (!summary) {
              return (
                <Card key={country} className="transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{COUNTRY_FLAGS[country]}</span>
                      <div>
                        <p className="text-sm font-medium">{country}</p>
                        <p className="text-[10px] text-muted-foreground">Not configured</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs gap-1.5"
                      onClick={() => handleInitialize(country)}
                      disabled={processing}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Initialize Country
                    </Button>
                  </CardContent>
                </Card>
              );
            }

            const statusColor = ROLLOUT_STATUS_COLORS[summary.rolloutStatus] || "bg-gray-100 text-gray-800";
            const migrationColor = MIGRATION_STATUS_COLORS[summary.dataMigrationStatus] || MIGRATION_STATUS_COLORS.NotStarted;
            const trainingColor = TRAINING_STATUS_COLORS[summary.trainingStatus] || TRAINING_STATUS_COLORS.NotStarted;

            return (
              <Card key={country} className="transition-all hover:shadow-sm">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{COUNTRY_FLAGS[country]}</span>
                      <div>
                        <p className="text-sm font-medium">{country}</p>
                        {summary.pilotCountry && (
                          <Badge className="text-[8px] h-4 px-1 bg-amber-100 text-amber-800 border-amber-300">
                            Pilot
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5 border", statusColor)}>
                      {summary.rolloutStatus}
                    </Badge>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Data Migration</span>
                      <Badge variant="outline" className={cn("text-[8px] h-4 px-1 border", migrationColor)}>
                        {summary.dataMigrationStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Training</span>
                      <Badge variant="outline" className={cn("text-[8px] h-4 px-1 border", trainingColor)}>
                        {summary.trainingStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Role Setup</span>
                      {summary.roleSetupComplete ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                  </div>

                  {/* Training Completion */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium">Training Completion</span>
                      <span className="text-[10px] text-muted-foreground">{Math.round(summary.trainingCompletionRate)}%</span>
                    </div>
                    <Progress value={summary.trainingCompletionRate}>
                      <ProgressTrack>
                        <ProgressIndicator
                          style={{ width: `${summary.trainingCompletionRate}%` }}
                          className={cn(
                            summary.trainingCompletionRate >= 80 && "bg-green-500",
                            summary.trainingCompletionRate >= 40 && summary.trainingCompletionRate < 80 && "bg-amber-500",
                            summary.trainingCompletionRate < 40 && "bg-red-500"
                          )}
                        />
                      </ProgressTrack>
                    </Progress>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-center p-1.5 bg-muted/50 rounded">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Field Officers
                      </div>
                      <p className="text-sm font-bold">{summary.fieldOfficerCount}</p>
                    </div>
                    <div className="text-center p-1.5 bg-muted/50 rounded">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        Lenders
                      </div>
                      <p className="text-sm font-bold">{summary.lenderCount}</p>
                    </div>
                  </div>

                  {summary.activeUsersCount > 0 && (
                    <div className="text-[10px] text-muted-foreground text-center mb-3">
                      {summary.activeUsersCount} active users
                    </div>
                  )}

                  {/* Configure Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[10px] gap-1"
                    onClick={() => openConfigureDialog(summary)}
                  >
                    <Settings className="h-3 w-3" />
                    Configure
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Configure Dialog */}
      <Dialog open={!!configureDialogCountry} onOpenChange={() => setConfigureDialogCountry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Configure {configureDialogCountry}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Rollout Status</Label>
              <Select value={formRolloutStatus} onValueChange={(v) => setFormRolloutStatus((v ?? "Pending") as RolloutStatus)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLLOUT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Field Officer Count</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={formFieldOfficerCount}
                  onChange={(e) => setFormFieldOfficerCount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role Setup Complete</Label>
                <Select
                  value={formRoleSetupComplete ? "true" : "false"}
                  onValueChange={(v) => setFormRoleSetupComplete(v === "true")}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data Migration Status</Label>
              <Select value={formDataMigrationStatus} onValueChange={(v) => setFormDataMigrationStatus(v ?? "Pending")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NotStarted">Not Started</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Training Status</Label>
              <Select value={formTrainingStatus} onValueChange={(v) => setFormTrainingStatus(v ?? "Pending")}>
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
            <Button variant="outline" size="sm" onClick={() => setConfigureDialogCountry(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfigure} disabled={processing}>
              {processing ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
