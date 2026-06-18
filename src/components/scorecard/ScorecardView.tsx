"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileSearch,
  Loader2,
  MapPin,
  Plus,
  User,
} from "lucide-react";
import { cn, formatScore, getScoreColor, getScoreBgColor } from "@/lib/utils";
import {
  COUNTRY_FLAGS,
  ACTIVATION_AREA_LABELS,
  ACTIVATION_AREA_ICONS,
  type Country,
  type ScorecardSnapshot,
  type ActivationArea,
} from "@/lib/types";
import { ScorecardTraceability } from "./ScorecardTraceability";

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];

const SCORE_MAP: { key: keyof Pick<ScorecardSnapshot, "commitmentScore" | "productScore" | "operationalScore" | "riskScore" | "relationshipScore" | "marketScore">; area: ActivationArea }[] = [
  { key: "commitmentScore", area: "commitment" },
  { key: "productScore", area: "product" },
  { key: "operationalScore", area: "operational" },
  { key: "riskScore", area: "risk" },
  { key: "relationshipScore", area: "relationship" },
  { key: "marketScore", area: "market" },
];

interface LenderOption {
  id: string;
  institutionName: string;
  country: string;
}

export function ScorecardView() {
  const [scorecards, setScorecards] = useState<(ScorecardSnapshot & { institutionName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lenders, setLenders] = useState<LenderOption[]>([]);
  const [lendersLoading, setLendersLoading] = useState(false);
  const [selectedLenderId, setSelectedLenderId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (selectedCountry) params.set("country", selectedCountry);
    fetch(`/api/scorecard?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setScorecards(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedCountry, refreshKey]);

  const fetchLenders = useCallback(async () => {
    setLendersLoading(true);
    try {
      const res = await fetch("/api/lenders");
      if (res.ok) {
        const data = await res.json();
        setLenders(
          data.map((l: { id: string; institutionName: string; country: string }) => ({
            id: l.id,
            institutionName: l.institutionName,
            country: l.country,
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLendersLoading(false);
    }
  }, []);

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSelectedLenderId("");
    fetchLenders();
  };

  const handleGenerate = async () => {
    if (!selectedLenderId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lenderId: selectedLenderId,
          performedBy: "current-user",
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setSelectedLenderId("");
        setLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  // If a scorecard is selected, show traceability view
  if (selectedId) {
    return (
      <ScorecardTraceability
        scorecardId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-4 view-transition">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-aceli" />
          <h2 className="font-bold text-lg text-foreground">Scorecards</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedCountry || "all"}
            onValueChange={(val) => {
              setLoading(true);
              setSelectedCountry(!val || val === "all" ? null : (val as Country));
            }}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All Countries</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {COUNTRY_FLAGS[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="bg-aceli hover:bg-aceli-dark text-white"
            onClick={handleOpenDialog}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Generate
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading scorecards...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && scorecards.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <FileSearch className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No scorecards found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate a scorecard for a lender to see activation snapshots here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scorecard list */}
      {!loading && scorecards.length > 0 && (
        <ScrollArea className="max-h-[calc(100vh-180px)]">
          <div className="space-y-3 pr-1">
            {scorecards.map((sc) => (
              <Card key={sc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-aceli shrink-0" />
                        <span className="font-semibold text-sm text-foreground truncate">
                          {sc.institutionName || sc.lenderId}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {COUNTRY_FLAGS[sc.country as Country] || ""} {sc.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(sc.snapshotDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-center shrink-0">
                      <p className={cn("text-xl font-bold", getScoreColor(sc.overallScore))}>
                        {formatScore(sc.overallScore)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Overall</p>
                    </div>
                  </div>

                  {/* 6 activation bars */}
                  <div className="space-y-2 mb-3">
                    {SCORE_MAP.map(({ key, area }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-foreground flex items-center gap-1">
                            <span>{ACTIVATION_AREA_ICONS[area]}</span>
                            {ACTIVATION_AREA_LABELS[area]}
                          </span>
                          <span className={cn("text-[11px] font-medium", getScoreColor(sc[key]))}>
                            {formatScore(sc[key])}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={sc[key] * 100} className="h-1.5 flex-1" />
                          <div className={cn("h-1.5 w-1.5 rounded-full", getScoreBgColor(sc[key]))} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer: reviewed/pending + traceability button */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {sc.reviewedByCount} reviewed
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {sc.pendingCount} pending
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-aceli hover:text-aceli-dark text-xs h-7 px-2"
                      onClick={() => setSelectedId(sc.id)}
                    >
                      View Traceability
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Generate Scorecard Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Scorecard</DialogTitle>
            <DialogDescription>
              Select a lender to generate a new activation scorecard snapshot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {lendersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : lenders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No lenders available.
              </p>
            ) : (
              <Select value={selectedLenderId} onValueChange={(v) => setSelectedLenderId(v ?? "")}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Select a lender..." />
                </SelectTrigger>
                <SelectContent>
                  {lenders.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {l.institutionName}
                        <span className="text-muted-foreground text-xs">
                          ({COUNTRY_FLAGS[l.country as Country]} {l.country})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              size="sm"
              className="bg-aceli hover:bg-aceli-dark text-white"
              disabled={!selectedLenderId || generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
