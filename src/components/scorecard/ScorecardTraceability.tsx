"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  Loader2,
  MapPin,
  User,
  FileText,
} from "lucide-react";
import { cn, formatScore, getScoreColor, getScoreBgColor } from "@/lib/utils";
import {
  COUNTRY_FLAGS,
  ACTIVATION_AREA_LABELS,
  ACTIVATION_AREA_ICONS,
  getConfidenceLevel,
  type Country,
  type ScorecardSnapshot,
  type ScorecardTraceEntry,
  type ActivationArea,
} from "@/lib/types";

const SCORE_MAP: { key: keyof Pick<ScorecardSnapshot, "commitmentScore" | "productScore" | "operationalScore" | "riskScore" | "relationshipScore" | "marketScore">; area: ActivationArea }[] = [
  { key: "commitmentScore", area: "commitment" },
  { key: "productScore", area: "product" },
  { key: "operationalScore", area: "operational" },
  { key: "riskScore", area: "risk" },
  { key: "relationshipScore", area: "relationship" },
  { key: "marketScore", area: "market" },
];

const REVIEW_STATUS_COLORS: Record<string, string> = {
  Approved: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
  Escalated: "bg-orange-100 text-orange-800 border-orange-200",
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  FollowUp: "bg-blue-100 text-blue-800 border-blue-200",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

interface ScorecardTraceabilityProps {
  scorecardId: string;
  onBack: () => void;
}

export function ScorecardTraceability({ scorecardId, onBack }: ScorecardTraceabilityProps) {
  const [snapshot, setSnapshot] = useState<ScorecardSnapshot | null>(null);
  const [traceEntries, setTraceEntries] = useState<ScorecardTraceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionName, setInstitutionName] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/scorecard/${scorecardId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSnapshot(data.snapshot);
          setTraceEntries(data.traceEntries || []);
          setInstitutionName(data.snapshot?.institutionName || data.snapshot?.lenderId || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [scorecardId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading traceability data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Scorecards
        </Button>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Scorecard not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 view-transition">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Scorecards
      </Button>

      {/* Snapshot Header Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-aceli" />
                <h2 className="font-bold text-lg text-foreground">{institutionName}</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {COUNTRY_FLAGS[snapshot.country as Country] || ""} {snapshot.country}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Snapshot: {new Date(snapshot.snapshotDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-center shrink-0">
              <p className={cn("text-2xl font-bold", getScoreColor(snapshot.overallScore))}>
                {formatScore(snapshot.overallScore)}
              </p>
              <p className="text-[10px] text-muted-foreground">Overall</p>
            </div>
          </div>

          {/* 6 activation bars */}
          <div className="space-y-2">
            {SCORE_MAP.map(({ key, area }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-foreground flex items-center gap-1.5">
                    <span>{ACTIVATION_AREA_ICONS[area]}</span>
                    {ACTIVATION_AREA_LABELS[area]}
                  </span>
                  <span className={cn("text-xs font-medium", getScoreColor(snapshot[key]))}>
                    {formatScore(snapshot[key])}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={snapshot[key] * 100} className="h-1.5 flex-1" />
                  <div className={cn("h-1.5 w-1.5 rounded-full", getScoreBgColor(snapshot[key]))} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traceability Entries */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-aceli" />
            <h3 className="font-semibold text-sm text-foreground">
              Extraction Traceability
            </h3>
            <Badge variant="secondary" className="text-[10px] h-5">
              {traceEntries.length} entries
            </Badge>
          </div>

          {traceEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No extraction trace entries found for this scorecard.
            </p>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2 pr-1 custom-scrollbar">
                {traceEntries.map((entry) => {
                  const confLevel = getConfidenceLevel(entry.confidenceScore);
                  return (
                    <div
                      key={entry.extractionId}
                      className="rounded-lg border bg-card p-3 space-y-2"
                    >
                      {/* Row 1: Area icon + field name + confidence + review status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">
                            {ACTIVATION_AREA_ICONS[entry.activationArea as ActivationArea] || "📋"}
                          </span>
                          <span className="text-xs font-medium text-foreground truncate">
                            {entry.fieldName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] h-5 border", CONFIDENCE_COLORS[confLevel])}
                          >
                            {Math.round(entry.confidenceScore * 100)}%
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] h-5 border",
                              REVIEW_STATUS_COLORS[entry.reviewStatus] || "bg-gray-100 text-gray-800 border-gray-200"
                            )}
                          >
                            {entry.reviewStatus}
                          </Badge>
                        </div>
                      </div>

                      {/* Row 2: Extracted value */}
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                        <span className="font-medium text-foreground mr-1">Value:</span>
                        {entry.extractedValue || <span className="italic">—</span>}
                      </div>

                      {/* Row 3: Metadata */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span>{ACTIVATION_AREA_ICONS[entry.activationArea as ActivationArea]}</span>
                          {ACTIVATION_AREA_LABELS[entry.activationArea as ActivationArea] || entry.activationArea}
                        </span>
                        {entry.reviewedBy && (
                          <span className="flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            {entry.reviewedBy}
                          </span>
                        )}
                        {entry.reviewedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(entry.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-2.5 w-2.5" />
                          Meeting: {new Date(entry.meetingDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
